# Feature 16 — Transaction Enhancements

## Goal

Incrementally improve the transaction workflow with four high-value additions: notes on transactions, undo after accidental deletion, bulk category assignment for multiple transactions, and duplicate detection.

---

## 16.1 — Transaction Notes

### User story
As a user I want to add a free-text note to any transaction (e.g., "birthday dinner", "invoice #1042") so I can find and recall it later.

### Frontend

`TransactionFormDialog.tsx` — add a `notes` textarea below the amount field:

```tsx
<Input
    id='notes'
    type='text'
    label={t('transactions.notes', 'Notes')}
    placeholder={t('transactions.notesPlaceholder', 'Optional note...')}
    {...register('notes')}
/>
```

`TransactionTable.tsx` — show notes inline below the payee/category line if present:
- Small secondary text in `var(--text-color-secondary)`, truncated at 60 chars with `title` showing full text on hover.

`TransactionFormData` type — add `notes?: string`.

### Backend

`notes` column already exists in the `transactions` table (see Feature 02 spec).
Verify it is included in create/update request handling. Add to the response shape if not already present.

---

## 16.2 — Undo Delete (5-second toast)

### User story
As a user I want a brief window to undo an accidental transaction deletion before it becomes permanent.

### Design

1. On delete confirmation:
   a. Remove the transaction from the local RTK Query cache immediately (optimistic removal).
   b. Show a toast-style `<Message>` at the bottom of the screen: "Transaction deleted. **Undo**" with a 5-second countdown.
   c. If user clicks "Undo": re-insert the cached transaction data via `addTransaction` mutation. Close toast.
   d. If 5 seconds pass: call `deleteTransaction` mutation (actual server delete). Toast fades.

### Frontend

New component: `client/src/components/undo-toast/UndoToast.tsx`

```typescript
interface UndoToastProps {
    message: string
    duration: number   // ms, default 5000
    onUndo: () => void
    onExpire: () => void
}
```

Positioned fixed at bottom-center. Uses `useEffect` for the countdown timer. Renders a `<Message>` with an "Undo" `Button mode='link'` inline.

`TransactionTable.tsx`:
- Replace direct `deleteTransaction` call with optimistic flow above.
- Render `<UndoToast>` when `pendingDelete` state is set.

> **Note:** This is a client-side optimistic approach. No backend changes needed. The server delete is deferred by 5 seconds.

---

## 16.3 — Bulk Category Assignment

### User story
As a user I want to select multiple uncategorized transactions and assign them all to the same category at once, instead of editing them one by one.

### Design

When checkboxes are selected in `TransactionTable`:
- The existing "Delete selected" action button in the toolbar gains a second button: "Categorize selected".
- Clicking it opens a small `Dialog` with a single `CategorySelectField`.
- On confirm: call `bulkCategorizeTransactions` mutation.

### Frontend

`Transactions.tsx` — add "Categorize" button to bulk-action toolbar (next to "Delete selected").

New `Dialog` component inline in `Transactions.tsx`:
```tsx
<Dialog open={showBulkCategory} title={t('transactions.bulkCategoryTitle', 'Assign Category')}>
    <CategorySelectField value={bulkCategoryId} onSelect={…} />
    <Button label={t('common.apply', 'Apply')} onClick={handleBulkCategory} />
    <Button label={t('common.cancel', 'Cancel')} mode='outline' onClick={() => setShowBulkCategory(false)} />
</Dialog>
```

New RTK Query endpoint:
```typescript
bulkCategorizeTransactions: builder.mutation<void, { ids: string[]; category_id: string }>({
    query: (body) => ({ url: 'transactions/bulk-categorize', method: 'PATCH', body }),
    invalidatesTags: ['Transaction', 'Dashboard'],
})
```

### Backend

New endpoint: `PATCH /transactions/bulk-categorize`

Body: `{ ids: string[], category_id: string }`

Logic: `UPDATE transactions SET category_id = ? WHERE id IN (?) AND user_id = ?`

Route: `$routes->patch('transactions/bulk-categorize', 'TransactionController::bulkCategorize');`

---

## 16.4 — Duplicate Detection

### User story
As a user I want to be warned when I'm about to enter a transaction that looks like one I already recorded, so I can avoid double-counting.

### Heuristic

A potential duplicate is flagged when ALL of the following match an existing transaction:
- Same `account_id`
- Same `amount` (±0)
- Same `payee` (case-insensitive, trimmed)
- Date within ±3 days

### Design

In `TransactionFormDialog.tsx`, after the user has filled in amount + payee + date + account:
- After a 500ms debounce, call a `GET /transactions/check-duplicate` endpoint with those four fields.
- If a match is found, show a `<Message type='warning'>` above the submit button:
  "A similar transaction was recorded on March 20: Starbucks –$5.50. Are you sure this is a new one?"
- User can still submit — the warning is advisory only.

### Backend

New endpoint: `GET /transactions/check-duplicate`

Query params: `account_id`, `amount`, `payee`, `date`

Returns: `{ duplicate: boolean, match?: { id, date, amount, payee } }`

Route: `$routes->get('transactions/check-duplicate', 'TransactionController::checkDuplicate');`

---

## i18n Keys

```
transactions.notes
transactions.notesPlaceholder
transactions.undoDelete
transactions.undoButton
transactions.bulkCategoryTitle
transactions.bulkCategoryApply
transactions.duplicateWarning
```

---

## Acceptance Criteria

- [ ] Notes field appears in create and edit forms; saved and displayed on transaction row.
- [ ] Delete shows 5-second undo toast; undo restores the transaction; expiry triggers actual deletion.
- [ ] "Categorize selected" button appears when ≥ 1 transaction is selected; assigns category to all selected.
- [ ] Bulk categorize updates the `category_id` on all selected rows without reloading the page.
- [ ] Duplicate warning appears after user fills amount + payee + date + account matching an existing transaction.
- [ ] Duplicate warning is non-blocking — user can still save.
- [ ] All strings translated.
