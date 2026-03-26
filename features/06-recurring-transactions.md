# Feature 06 — Recurring Transactions

## Goal

Allow users to define repeating financial events (rent, salary, subscriptions) so Money Pilot can show upcoming obligations and automatically create transaction entries on their scheduled dates.

This feature requires **new backend infrastructure** (model + migration + controller) and a new frontend screen to replace the empty Recurring stub.

---

## UI / UX Requirements

- Responsive list of recurring rules with upcoming next-occurrence dates.
- Add/edit form in a `Dialog`.
- Each rule shows: name, amount, category, account, frequency, next due date, active/paused toggle.
- "Generate now" action to manually create the next transaction from a rule.
- All UI via `simple-react-ui-kit`.

---

## Recurring Rule Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner |
| `name` | varchar(255) | E.g. "Netflix", "Rent" |
| `type` | enum: income/expense | Transaction type |
| `amount` | decimal(12,2) | Fixed amount |
| `account_id` | UUID FK | Target account |
| `category_id` | UUID FK (nullable) | Category |
| `payee_name` | varchar(255) nullable | Payee |
| `notes` | text nullable | Notes |
| `frequency` | enum | `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly` |
| `start_date` | date | When to start |
| `end_date` | date nullable | Optional end date |
| `next_due_date` | date | Next occurrence (auto-computed) |
| `is_active` | tinyint | 1 = active, 0 = paused |
| `auto_create` | tinyint | 1 = auto-post transactions, 0 = reminder only |
| `created_at` | datetime | — |
| `updated_at` | datetime | — |

---

## Frontend Tasks

### New files
- `client/src/screens/Recurring/index.tsx` — replaces empty stub
- `client/src/screens/Recurring/Recurring.module.sass`

### Screen layout

**Header row:** title + "Add Recurring" button

**List view:** each rule as a `Container` card or table row:
- Icon: category emoji (or generic repeat icon)
- Name + payee
- Amount (colored by type)
- Frequency `Badge`
- Next due date (highlighted red if overdue)
- Active toggle (`Checkbox`)
- Action menu `Popout`: Edit / Generate Now / Delete

**Empty state:** illustration + "No recurring transactions yet" + add button

### Add/Edit Dialog
Fields (React Hook Form):
1. Name (`Input`, required)
2. Type (`Select`: Income / Expense, required)
3. Amount (`CurrencyInput`, required)
4. Account (`AccountSelectField`, required)
5. Category (`CategorySelectField`, optional)
6. Payee (`Input`, optional)
7. Frequency (`Select`: Daily / Weekly / Biweekly / Monthly / Quarterly / Yearly)
8. Start date (`DatePicker`, single date, required)
9. End date (`DatePicker`, single date, optional)
10. Auto-create (`Checkbox`: "Automatically create transactions on due date")
11. Notes (`Input`)

### Modified files
- `client/src/api/api.ts` — add recurring endpoints

### New RTK Query endpoints
```typescript
listRecurring: builder.query<RecurringRule[], void>({
    query: () => '/recurring',
    providesTags: ['Recurring'],
})

addRecurring: builder.mutation<RecurringRule, CreateRecurringBody>({
    query: (body) => ({ url: '/recurring', method: 'POST', body }),
    invalidatesTags: ['Recurring'],
})

updateRecurring: builder.mutation<RecurringRule, { id: string; body: UpdateRecurringBody }>({
    query: ({ id, body }) => ({ url: `/recurring/${id}`, method: 'PUT', body }),
    invalidatesTags: ['Recurring'],
})

deleteRecurring: builder.mutation<void, string>({
    query: (id) => ({ url: `/recurring/${id}`, method: 'DELETE' }),
    invalidatesTags: ['Recurring'],
})

generateRecurring: builder.mutation<Transaction, string>({
    query: (id) => ({ url: `/recurring/${id}/generate`, method: 'POST' }),
    invalidatesTags: ['Transaction', 'Recurring'],
})
```

### Translations (i18n keys to add)
```
recurring.title
recurring.addRecurring
recurring.editRecurring
recurring.deleteRecurring
recurring.noRecurring
recurring.addFirst
recurring.frequency.daily
recurring.frequency.weekly
recurring.frequency.biweekly
recurring.frequency.monthly
recurring.frequency.quarterly
recurring.frequency.yearly
recurring.nextDue
recurring.startDate
recurring.endDate
recurring.autoCreate
recurring.generateNow
recurring.active
recurring.paused
recurring.overdue
recurring.deleteConfirmTitle
recurring.deleteConfirmBody
```

---

## Backend Tasks

### 1. Migration

`server/app/Database/Migrations/YYYY-MM-DD-000001_CreateRecurringTable.php`:

```sql
CREATE TABLE `recurring_transactions` (
    `id`           CHAR(36)        NOT NULL,
    `user_id`      CHAR(36)        NOT NULL,
    `name`         VARCHAR(255)    NOT NULL,
    `type`         ENUM('income','expense') NOT NULL,
    `amount`       DECIMAL(12,2)   NOT NULL,
    `account_id`   CHAR(36)        NOT NULL,
    `category_id`  CHAR(36)        NULL,
    `payee_name`   VARCHAR(255)    NULL,
    `notes`        TEXT            NULL,
    `frequency`    ENUM('daily','weekly','biweekly','monthly','quarterly','yearly') NOT NULL DEFAULT 'monthly',
    `start_date`   DATE            NOT NULL,
    `end_date`     DATE            NULL,
    `next_due_date` DATE           NOT NULL,
    `is_active`    TINYINT(1)      NOT NULL DEFAULT 1,
    `auto_create`  TINYINT(1)      NOT NULL DEFAULT 0,
    `created_at`   DATETIME        NOT NULL,
    `updated_at`   DATETIME        NOT NULL,
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_next_due_date` (`next_due_date`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
    FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`),
    FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`)
);
```

### 2. Model

`server/app/Models/RecurringTransactionModel.php`:
- CRUD methods.
- `getNextDueDate(string $frequency, string $from): string` — compute next date based on frequency.
- `getDueToday(string $userId): array` — fetch rules where `next_due_date <= CURDATE()` and `is_active = 1` and (`end_date IS NULL` OR `end_date >= CURDATE()`).

### 3. Controller

`server/app/Controllers/RecurringController.php`:

| Method | Route | Description |
|--------|-------|-------------|
| `index()` | GET /recurring | List all recurring rules for user |
| `create()` | POST /recurring | Create new rule; compute initial `next_due_date` |
| `update($id)` | PUT /recurring/{id} | Update rule; recompute `next_due_date` if start_date or frequency changed |
| `delete($id)` | DELETE /recurring/{id} | Delete rule |
| `generate($id)` | POST /recurring/{id}/generate | Create a transaction from this rule NOW; advance `next_due_date` |
| `toggle($id)` | PATCH /recurring/{id}/toggle | Toggle `is_active` |

**`generate()` logic:**
1. Load the recurring rule.
2. Create a transaction in `transactions` table (same logic as `TransactionController::create()`).
3. Update `account.balance`.
4. Advance `next_due_date` using `getNextDueDate(frequency, current_next_due_date)`.
5. Return the created transaction.

### 4. Routes

```php
$routes->get('recurring', 'RecurringController::index');
$routes->post('recurring', 'RecurringController::create');
$routes->put('recurring/(:segment)', 'RecurringController::update/$1');
$routes->delete('recurring/(:segment)', 'RecurringController::delete/$1');
$routes->post('recurring/(:segment)/generate', 'RecurringController::generate/$1');
$routes->patch('recurring/(:segment)/toggle', 'RecurringController::toggle/$1');
```

### 5. (Optional) Auto-generation via CI4 Task

For full automation, create a CodeIgniter 4 Task (Spark command or CI4 4.3+ Tasks):
- `php spark recurring:process` — processes all due recurring rules where `auto_create = 1`.
- Can be run via a cron job: `0 6 * * * php spark recurring:process`.

---

## Acceptance Criteria

- [ ] Recurring rules can be created with all fields including frequency and auto-create toggle.
- [ ] Next due date is computed correctly for each frequency type.
- [ ] "Generate Now" creates a real transaction and advances the next due date.
- [ ] Overdue rules (next due date in the past) are visually highlighted.
- [ ] Active/paused toggle works without a full reload.
- [ ] Edit dialog pre-populates all fields.
- [ ] Delete removes the rule but does not remove already-created transactions.
- [ ] End date is respected — expired rules are shown as inactive.
- [ ] All strings translated.
- [ ] Mobile layout works correctly.
