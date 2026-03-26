# Feature 04 — Categories: Complete CRUD

## Goal

Add **delete** (with usage safety check) and optional **archive** to the Categories screen. Polish the budget progress UI and ensure the emoji + color pickers work correctly in both add and edit forms.

---

## UI / UX Requirements

- Categories displayed as cards or a styled list with emoji icon, name, type badge, budget bar, and action menu.
- Expense categories show a monthly `Progress` bar: spent / budget.
- Income categories show total received this month (no budget bar needed).
- Delete blocked if category is used by any transaction.
- Archive option: soft-hide the category from the add-transaction dropdown while preserving historical data.
- All UI via `simple-react-ui-kit`.

---

## Category Types

| Type | Description |
|------|-------------|
| `expense` | Outgoing money; has optional monthly budget |
| `income` | Incoming money |

---

## Frontend Tasks

### Category Card/Row Enhancement
- Show: emoji icon, name, type `Badge`, monthly spend vs. budget.
- Budget `Progress` bar: color `'green'` when < 80 %, `'orange'` when 80–99 %, `'red'` when ≥ 100 %.
- Action `Popout`: Edit / Archive / Delete.

### Edit Form
- Open existing add form in a `Dialog` pre-populated with category data.
- Fields: name (`Input`), type (`Select`), emoji (`EmojiPicker`), color (`ColorPicker`), monthly budget (`CurrencyInput`, shown only when type = expense).

### Delete Flow
- Check `transaction_count` from the category list response.
- If used: `Dialog` with `Message type="error"` — cannot delete.
- If unused: confirmation `Dialog` → `deleteCategory` mutation.

### Archive Flow
- `PATCH /categories/{id}/archive` toggle.
- Archived categories shown at the bottom of the list with reduced opacity and "Archived" `Badge`.
- Toggle unarchive from the same action menu.

### Modified files
- `client/src/screens/Categories/index.tsx`
- `client/src/api/api.ts` — add `updateCategory` (if not present), `deleteCategory`, `archiveCategory`

### New RTK Query endpoints
```typescript
deleteCategory: builder.mutation<void, string>({
    query: (id) => ({ url: `/categories/${id}`, method: 'DELETE' }),
    invalidatesTags: ['Category'],
})

archiveCategory: builder.mutation<Category, { id: string; archived: boolean }>({
    query: ({ id, archived }) => ({
        url: `/categories/${id}/archive`,
        method: 'PATCH',
        body: { archived },
    }),
    invalidatesTags: ['Category'],
})
```

### Translations (i18n keys to add)
```
categories.editCategory
categories.deleteCategory
categories.archiveCategory
categories.unarchiveCategory
categories.deleteConfirmTitle
categories.deleteConfirmBody
categories.deleteBlockedTitle
categories.deleteBlockedBody
categories.budget
categories.spent
categories.of
categories.noBudget
categories.archived
categories.type.expense
categories.type.income
categories.noCategories
categories.addFirst
```

---

## Backend Tasks

### 1. Delete endpoint

`DELETE /categories/{id}`:
1. Check `transactions.category_id = $id` count.
2. If > 0: return `HTTP 422` with `{ "error": "category_has_transactions" }`.
3. Else: delete and return `HTTP 204`.

### 2. Archive toggle

Add `archived` column (tinyint, default 0) to `categories` table via a new migration.

`PATCH /categories/{id}/archive`:
- Body: `{ "archived": true|false }`
- Toggle the `archived` flag.
- Return updated category.

Update `GET /categories` to:
- By default return only non-archived categories.
- Accept `?include_archived=1` to include archived (for settings/management view).

### 3. Transaction count in category list

Add `transaction_count` to category list response (similar to accounts):
```json
{
    "id": "...",
    "name": "Groceries",
    "emoji": "🛒",
    "color": "#4bb34b",
    "type": "expense",
    "budget": 500.00,
    "spent": 320.00,
    "transaction_count": 18,
    "archived": false
}
```

---

## Acceptance Criteria

- [ ] Budget progress bars display correct colors based on spend percentage.
- [ ] Edit dialog pre-populates all fields including emoji and color.
- [ ] Delete is blocked when category has transactions, with a clear explanation.
- [ ] Archive hides category from transaction-add dropdowns while preserving history.
- [ ] Archived categories are still visible (with archive badge) in the Categories screen.
- [ ] Unarchive restores the category to normal use.
- [ ] All strings translated.
- [ ] Layout responsive on mobile.
