# Feature 02 — Transactions: Complete CRUD

## Goal

The Transactions screen has list + add + edit. This feature adds the missing pieces: **delete**, **search**, **filter** (by account, category, date range, type), and **pagination**. The backend needs delete exposed and filter/search query params added.

---

## UI / UX Requirements

- Responsive: on mobile the table collapses to a card/list layout.
- Filters accessible via a collapsible filter bar or a `Popout`/`Dialog` panel.
- All UI via `simple-react-ui-kit` (`Select`, `Input`, `DatePicker`, `Button`, `Dialog`, `Table`, `Badge`, `Spinner`).
- Optimistic delete with confirmation dialog.
- Pagination controls at the bottom of the table.

---

## Frontend Tasks

### Filter Bar
Add a filter section above the transaction table:

| Filter | Component | Notes |
|--------|-----------|-------|
| Search | `Input` (mode="ghost") | Debounced 300 ms, searches payee name and notes |
| Date range | `DatePicker` (range mode) | Default: current month |
| Type | `Select` | Options: All / Income / Expense |
| Account | `Select` (searchable) | Lists all user accounts |
| Category | `Select` (searchable) | Lists all user categories |

Filters are reflected as URL query params (React Router) so they survive refresh and can be deep-linked (e.g., from Dashboard category click).

### Delete Flow
- Each table row: action `Popout` with "Edit" and "Delete" options.
- On "Delete": show `Dialog` with `Message type="warning"` + confirm/cancel buttons.
- On confirm: call `deleteTransaction` mutation, invalidate `'Transaction'` cache tag.

### Pagination
- Page size: 25 per page.
- Pagination controls: Previous / Next buttons (or page numbers) using `Button` component.
- Total count displayed: "Showing 1–25 of 142 transactions".

### Edit Transaction
- Existing edit form in a `Dialog`.
- Ensure the form pre-populates all fields correctly (currently may be missing payee/notes).

### Modified files
- `client/src/screens/Transactions/index.tsx` — add filters, pagination, delete action
- `client/src/api/api.ts` — add `deleteTransaction`, update `listTransactions` to accept filter params

### New RTK Query params for `listTransactions`
```typescript
interface ListTransactionsParams {
    page?: number
    limit?: number
    search?: string
    dateFrom?: string    // YYYY-MM-DD
    dateTo?: string      // YYYY-MM-DD
    type?: 'income' | 'expense'
    accountId?: string
    categoryId?: string
}
```

### Translations (i18n keys to add)
```
transactions.search
transactions.filterByDate
transactions.filterByType
transactions.filterByAccount
transactions.filterByCategory
transactions.allTypes
transactions.income
transactions.expense
transactions.deleteConfirmTitle
transactions.deleteConfirmBody
transactions.delete
transactions.showing
transactions.of
transactions.noResults
transactions.notes
transactions.payee
```

---

## Backend Tasks

### 1. Delete endpoint

**Method:** `DELETE /transactions/{id}`

Already exists on the controller — verify it reverses the account balance change made during creation. The controller `delete()` method must:
1. Load the transaction.
2. Reverse its effect on `accounts.balance` (add back if expense, subtract if income).
3. Soft-delete or hard-delete the row.

Expose in routes if not already registered.

### 2. Filter & search params for `GET /transactions`

Update `TransactionController::index()` to accept:

| Param | Type | Behavior |
|-------|------|----------|
| `page` | int (default 1) | Offset = (page − 1) × limit |
| `limit` | int (default 25, max 100) | Page size |
| `search` | string | `LIKE %search%` on `payee_name`, `notes` |
| `date_from` | YYYY-MM-DD | `date >= date_from` |
| `date_to` | YYYY-MM-DD | `date <= date_to` |
| `type` | income/expense | Exact match on `type` column |
| `account_id` | UUID | Exact match on `account_id` |
| `category_id` | UUID | Exact match on `category_id` |

**Response envelope:**
```json
{
    "data": [ ...transactions... ],
    "meta": {
        "total": 142,
        "page": 1,
        "limit": 25,
        "pages": 6
    }
}
```

Update `TransactionModel` with a `search()` method that builds the query dynamically.

### 3. Notes field

Ensure the `notes` column exists in `transactions` table (add migration if missing). Include in create/update endpoints.

---

## Acceptance Criteria

- [ ] Transactions can be deleted with a confirmation dialog; account balance is reversed correctly.
- [ ] Search by payee name works with debounce.
- [ ] Date range filter correctly limits results.
- [ ] Type, account, and category filters work independently and in combination.
- [ ] Active filters are reflected in the URL and restored on page reload.
- [ ] Pagination shows correct page, total, and navigates correctly.
- [ ] Table is usable on mobile (horizontal scroll or card layout).
- [ ] All new strings are i18n-translated.
