# Feature 19 — Credit Card Payment Reminders & Transfers

## Goal

Users with credit cards need to track payment due dates and quickly pay off their balance.
This feature adds:
1. **Due date & reminder settings** on credit accounts.
2. **Transfer transaction type** — a new first-class transaction kind that links two accounts with no category or payee.
3. **Payment reminder banner** — shown globally on every page when a credit card balance is due soon.
4. **Quick-pay dialog** — one-click flow to create a transfer from any account to the credit card.

---

## Scope of Changes

| Area | What changes |
|------|-------------|
| `accounts` table | +`payment_due_day`, +`payment_reminder` |
| `transactions` table | `type` ENUM gains `transfer`; +`to_account_id` |
| Frontend: account form | New fields shown only for `type = credit` |
| Frontend: `AppLayout` | Global credit reminder banner |
| Frontend: `TransactionTable` | Transfer row renders "A → B" instead of payee + category |
| Frontend: API | New `createTransfer` mutation |
| Backend: `AccountController` | Accept and return new fields |
| Backend: `TransactionController` | Handle `transfer` type: dual balance update |

---

## Data Model

### `accounts` — new columns

| Column | Type | Notes |
|--------|------|-------|
| `payment_due_day` | TINYINT UNSIGNED nullable | Day of month (1–31) when payment is due |
| `payment_reminder` | TINYINT(1) | 1 = remind 5 days before due date; default 0 |

Only meaningful when `type = 'credit'`. Backend should accept these fields for any type but the UI only shows them for credit.

### `transactions` — changes

| Column | Change | Notes |
|--------|--------|-------|
| `type` | ENUM gains `'transfer'` | Alongside existing `'income'`, `'expense'` |
| `to_account_id` | +VARCHAR(15) nullable FK → `accounts.id` | NULL for income/expense; required for transfer |

For a transfer:
- `account_id` = **source** account (funds leave here)
- `to_account_id` = **destination** account (funds arrive here)
- `category_id` = NULL always
- `payee_id` = NULL always
- `amount` = positive decimal (the transferred sum)

Balance side-effects on create:
- Source account: `balance -= amount`
- Destination account: `balance += amount`

On delete of a transfer: reverse both balance adjustments.

---

## Backend Tasks

### 1. Migration: add columns to `accounts`

`server/app/Database/Migrations/YYYY-MM-DD-000001_AddCreditFieldsToAccounts.php`

```sql
ALTER TABLE accounts
    ADD COLUMN payment_due_day  TINYINT UNSIGNED NULL    AFTER institution,
    ADD COLUMN payment_reminder TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_due_day;
```

### 2. Migration: extend `transactions`

`server/app/Database/Migrations/YYYY-MM-DD-000002_AddTransferToTransactions.php`

```sql
ALTER TABLE transactions
    MODIFY COLUMN type ENUM('income', 'expense', 'transfer') NOT NULL DEFAULT 'expense',
    ADD COLUMN to_account_id VARCHAR(15) NULL AFTER account_id;

ALTER TABLE transactions
    ADD CONSTRAINT fk_transactions_to_account
        FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX idx_to_account_id ON transactions(to_account_id);
```

### 3. `AccountModel` — update allowed fields

Add `payment_due_day` and `payment_reminder` to `$allowedFields`.

Return them in `getAll()` and `find()` responses (they are already part of the table after migration).

### 4. `AccountController` — accept new fields

`PUT /accounts/{id}` and `POST /accounts`:
- Accept `payment_due_day` (int, 1–31, nullable) and `payment_reminder` (bool).
- Validate: if present, `payment_due_day` must be between 1 and 31.
- No server-side restriction to `type = credit` — validation is UX-only.

### 5. `TransactionController` — transfer support

**`POST /transactions`** — when `type = 'transfer'`:
1. Validate `to_account_id` is present, belongs to the same user/group, and is not equal to `account_id`.
2. Validate `amount > 0`.
3. Insert transaction row with `type = 'transfer'`, `category_id = NULL`, `payee_id = NULL`.
4. `source_account.balance -= amount`
5. `destination_account.balance += amount`
6. Return the created transaction (include `to_account_id` in response).

**`DELETE /transactions/{id}`** — when `type = 'transfer'`:
1. Reverse both balance adjustments before deleting.
2. `source_account.balance += amount`
3. `destination_account.balance -= amount`

**`GET /transactions`** — include `to_account_id` in every transaction object (NULL for non-transfers). Frontend needs this to render the transfer row.

**No edit (`PUT`) for transfers** — transfers are delete-and-recreate only. The edit dialog should hide the Edit button and show only Delete for transfer transactions.

### 6. Routes

No new routes needed — transfers go through existing `/transactions` endpoints.

---

## Frontend Tasks

### 6.1 API — `ApiModel.Transaction` type update

```typescript
// client/src/api/api.ts
interface Transaction {
    // ... existing fields
    type: 'income' | 'expense' | 'transfer'
    to_account_id?: string | null
}
```

Add `createTransfer` mutation (or reuse `addTransaction` — the mutation is the same, just pass `type: 'transfer'`). No separate endpoint needed.

### 6.2 API — `ApiModel.Account` type update

```typescript
interface Account {
    // ... existing fields
    payment_due_day?: number | null   // 1–31
    payment_reminder?: boolean
}
```

### 6.3 Account form — credit card fields

**File:** `client/src/screens/accounts/Accounts.tsx`

When `type === 'credit'` is selected in the add/edit dialog, show two extra fields below the type selector:

**Field: Payment due day**
- Label: `accounts.paymentDueDay` → "Payment due day"
- Component: `Select` with options 1–31 (label = "1st", "2nd", … "31st" — or just numbers).
- Nullable — user can leave it unset (no reminder possible without it).

**Field: Payment reminder**
- Label: `accounts.paymentReminder` → "Remind me 5 days before due date"
- Component: `Checkbox`.
- Disabled (and unchecked) if `payment_due_day` is not set.

Hide both fields when type is not `credit`. Reset both to null/false when user changes type away from `credit`.

**Form data type extension:**
```typescript
type AccountFormData = Pick<ApiModel.Account, 'name' | 'type' | 'balance' | 'institution'> & {
    payment_due_day?: number | null
    payment_reminder?: boolean
}
```

### 6.4 Global credit reminder banner

**File:** `client/src/components/app-layout/AppLayout.tsx`

**Where:** Render inside the main content area, above the page content (below the top bar).

**Logic — compute `dueCards`:**
```
For each account where:
  - type === 'credit'
  - payment_due_day != null
  - payment_reminder === true
  - balance > 0  (there is something to pay)
  - daysUntilNextDueDate(payment_due_day) <= 5
→ include in dueCards
```

Helper `daysUntilNextDueDate(day: number): number`:
- Given today's date and a due day, compute how many calendar days until the next occurrence of that day-of-month.
- Example: today = March 27, due day = 1 → next due = April 1 → 5 days.
- Example: today = March 27, due day = 30 → next due = March 30 → 3 days.
- Example: today = March 27, due day = 15 → next due = April 15 → 19 days (not shown).
- Handle month-end edge cases: if due day = 31 and current month has 30 days, use last day of month.

Extract this helper to `client/src/utils/dates.ts`.

**Banner render (one banner per due card):**
```
⚠️  [Card name] · [Bank name] · Balance: [amount] · Due in [N] days
                                              [Pay now →]
```

- Use `Message type='warning'` from `simple-react-ui-kit` or a custom styled banner if Message doesn't support inline actions.
- "Pay now" button opens the **Quick-pay dialog** (see §6.5).
- Dismissing a banner: hide for the current session only (no persistence needed).

**New files:**
- `client/src/components/app-layout/CreditReminderBanner.tsx` — single banner for one credit card.

### 6.5 Quick-pay dialog

**File:** `client/src/components/app-layout/CreditPaymentDialog.tsx`

Opened from "Pay now" button in the banner for a specific credit account.

**Fields:**

| Field | Component | Default value |
|-------|-----------|---------------|
| From account | `AccountSelectField` (excludes the target credit account itself) | — (user must pick) |
| Amount | `CurrencyInput` | `account.balance` (current credit card balance) |
| Date | `DatePicker` | Today |

**Submit — "Transfer":**
1. Call `addTransaction` mutation with:
   ```json
   {
     "type": "transfer",
     "account_id": "<selected source account>",
     "to_account_id": "<this credit account>",
     "amount": <entered amount>,
     "date": "<selected date>"
   }
   ```
2. On success: close dialog, invalidate `['Account', 'Transaction', 'Dashboard']` tags.
3. On error: show `Message type='error'`.

**Note:** Any account can be the source, including another credit card (paying one card with another is a valid use case per the spec).

### 6.6 Transfer row in `TransactionTable`

**File:** `client/src/components/transaction-table/TransactionTable.tsx`

When `tx.type === 'transfer'`:

- **Amount cell:** render with a neutral color (not green/red) — use a new `styles.amountTransfer` class.
- **Payee cell:** instead of payee name + account, render:
  ```
  [source account name] → [destination account name]
  ```
  Use the existing `payeeInfo` layout. Source = `account`, destination = account resolved from `tx.to_account_id`.
- **Category cell:** render nothing (empty, no badge, no "No category" placeholder).
- **Edit dialog:** when a transfer is opened via row click, show a read-only view or a dialog where only **Delete** is available (no edit fields). Add a note: "Transfers cannot be edited. Delete and recreate if needed."

**Style addition** (`styles.module.sass`):
```sass
.amountTransfer
    font-weight: 500
    font-size: 14px
    color: var(--input-label-color)
```

**Transfer indicator in payee area:**
```sass
.transferArrow
    color: var(--input-label-color)
    font-size: 13px
    flex-shrink: 0
```

---

## New i18n Keys

```
accounts.paymentDueDay
accounts.paymentReminder
accounts.paymentReminderHint        // "Enabled only when due day is set"

creditReminder.title                // "Credit card payment due"
creditReminder.dueInDays            // "Due in {{count}} day"
creditReminder.dueInDays_other      // "Due in {{count}} days"
creditReminder.dueToday             // "Due today"
creditReminder.balance              // "Balance"
creditReminder.payNow               // "Pay now"
creditReminder.dismiss              // "Dismiss"

transfers.paymentDialog             // "Pay credit card"
transfers.fromAccount               // "From account"
transfers.amount                    // "Amount"
transfers.date                      // "Date"
transfers.submit                    // "Transfer"
transfers.noEditNote                // "Transfers cannot be edited. Delete and recreate if needed."

transactions.type.transfer          // "Transfer"
```

---

## Acceptance Criteria

- [ ] Adding or editing a credit account shows payment due day selector and reminder checkbox.
- [ ] `payment_due_day` and `payment_reminder` are saved and returned by the API.
- [ ] Reminder banner appears on all pages for credit accounts where: reminder is on, balance > 0, due within 5 days.
- [ ] Multiple banners shown if multiple credit cards are due.
- [ ] Dismissing a banner hides it for the session (reappears on refresh).
- [ ] Quick-pay dialog pre-fills balance amount and today's date.
- [ ] Source account selector excludes the credit card being paid.
- [ ] Submitting the dialog creates a `transfer` transaction and updates both account balances.
- [ ] Transfer transactions appear in the transaction list with "Account A → Account B" layout and no category.
- [ ] Transfer amount is displayed in neutral color (not green/red).
- [ ] Clicking a transfer row shows a read-only view with Delete-only action.
- [ ] Deleting a transfer reverses both balance adjustments.
- [ ] All strings are translated (EN + RU).
- [ ] No regressions on existing income/expense transaction flows.

---

## Open Questions / Decisions

1. **Balance convention for credit accounts** — does `balance > 0` mean debt, or should the reminder trigger on `balance != 0`? Confirm with UX before implementing the banner logic.
2. **Month-end due days** — if `payment_due_day = 31` and the month has 28/30 days, treat as the last day of that month. Codify this in `daysUntilNextDueDate()`.
3. **Transfer edit** — currently spec says delete-and-recreate. Could be revisited if users find it painful.
4. **Reminder threshold** — hard-coded at 5 days for now. Could be made configurable per account in a future iteration.
