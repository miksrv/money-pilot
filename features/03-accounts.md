# Feature 03 — Accounts: Complete CRUD

## Goal

The Accounts screen supports list and add. This feature adds **edit**, **delete** (with balance-transfer safety check), and a richer account card layout showing balance trends and quick-action buttons.

---

## UI / UX Requirements

- Account cards in a responsive grid (2 columns on tablet, 1 column on mobile, 3+ on desktop).
- Each card shows: account name, type badge, current balance (formatted with currency), institution name (if set), and action menu.
- Edit and delete via a `Popout` action menu on each card.
- Delete blocked if account has transactions — show informative `Message` instead.
- All UI via `simple-react-ui-kit`.

---

## Account Types

| Type | Icon / Color hint |
|------|-------------------|
| `checking` | Bank / blue |
| `savings` | Piggy / green |
| `credit` | Card / orange |
| `investment` | Chart / purple |

---

## Frontend Tasks

### Account Card Redesign
- Replace the current table/list with a card grid.
- Each card: `Container` with `title` = account name, `action` = `Popout` with Edit/Delete.
- Card body: balance (large number, colored positive/negative), account type `Badge`, institution field.

### Edit Dialog
- Reuse the add form in a `Dialog`.
- Fields: name, type (`Select`), institution (text `Input`), currency (`Select`), initial balance (`CurrencyInput`), color (`ColorPicker`).
- Pre-populate all fields from the existing account data.

### Delete Flow
- On delete attempt: call `GET /accounts/{id}/check-delete` or check `transaction_count` in the account list response.
- If transactions exist: show `Dialog` with `Message type="error"` explaining the account cannot be deleted while it has transactions.
- If no transactions: show confirmation `Dialog` → call `deleteAccount` mutation.

### Add Account Button
- Sticky FAB on mobile, regular `Button` in header on desktop.

### Modified files
- `client/src/screens/Accounts/index.tsx`
- `client/src/api/api.ts` — add `updateAccount`, `deleteAccount` endpoints

### New RTK Query endpoints
```typescript
updateAccount: builder.mutation<Account, { id: string; body: UpdateAccountBody }>({
    query: ({ id, body }) => ({ url: `/accounts/${id}`, method: 'PUT', body }),
    invalidatesTags: ['Account'],
})

deleteAccount: builder.mutation<void, string>({
    query: (id) => ({ url: `/accounts/${id}`, method: 'DELETE' }),
    invalidatesTags: ['Account', 'Transaction'],
})
```

### Translations (i18n keys to add)
```
accounts.editAccount
accounts.deleteAccount
accounts.deleteConfirmTitle
accounts.deleteConfirmBody
accounts.deleteBlockedTitle
accounts.deleteBlockedBody
accounts.institution
accounts.currency
accounts.initialBalance
accounts.balance
accounts.noAccounts
accounts.addFirst
accounts.type.checking
accounts.type.savings
accounts.type.credit
accounts.type.investment
```

---

## Backend Tasks

### 1. Update endpoint — verify completeness

`PUT /accounts/{id}` — should already exist on `AccountController`. Verify:
- Updates `name`, `type`, `institution`, `currency`, `color`.
- Does **not** directly overwrite `balance` (balance changes via transactions only).
- Returns updated account object.

### 2. Delete endpoint

`DELETE /accounts/{id}`:
1. Check `transactions` table for any rows with `account_id = $id`.
2. If found: return `HTTP 422` with `{ "error": "account_has_transactions" }`.
3. If none: delete the account row and return `HTTP 204`.

### 3. Transaction count in account list

Update `GET /accounts` response to include `transaction_count` per account so the frontend can show/hide the delete option without an extra round-trip:

```json
{
    "id": "...",
    "name": "Main Checking",
    "type": "checking",
    "balance": 2450.00,
    "currency": "USD",
    "institution": "Chase",
    "transaction_count": 47
}
```

Update `AccountModel::getAll()` to LEFT JOIN count from `transactions`.

---

## Acceptance Criteria

- [ ] Account cards display name, type, balance, and institution.
- [ ] Edit dialog pre-populates all fields and saves correctly.
- [ ] Delete is blocked (with explanation) when the account has transactions.
- [ ] Delete works and removes the account when it has no transactions.
- [ ] Account balances update automatically after adding/editing transactions (via cache invalidation).
- [ ] Layout is responsive: card grid adapts from 1 to 3+ columns.
- [ ] All strings translated.
