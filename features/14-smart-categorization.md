# Feature 14 — Smart Categorization

## Goal

Reduce the friction of categorizing transactions by remembering the user's choices and applying them automatically. When a user adds a transaction for a payee they've used before, the category should be pre-selected based on their history — no manual selection required in the common case.

---

## Mechanism

### Default category per payee

Each payee stores a `default_category_id` (nullable FK to categories). When the user selects a category for a transaction with a given payee, the system remembers it. On the next transaction with the same payee, `CategorySelectField` is pre-populated with that category.

**Learning rule:** The `default_category_id` is updated every time the user explicitly selects a category for that payee. It reflects the *most recently used* category, not a vote count.

### Auto-apply in transaction form

When `TransactionFormDialog` loads and the payee field has a value:
1. Look up the payee's `default_category_id` from the payee list response.
2. If found, set that as the initial `category_id` in the form (overrides the normal auto-select-first behavior).
3. User can still change it manually.

---

## Frontend Tasks

### `TransactionFormDialog.tsx` — auto-apply logic

1. After `payee` field changes (debounced), find the matching payee object from `useListPayeesQuery` response.
2. If `payee.default_category_id` is set, call `setValue('category_id', payee.default_category_id)`.
3. Show a subtle hint below the category field: "Auto-selected from previous transaction with this payee" — disappears if user manually changes the category.

### `CategorySelectField.tsx` — no changes needed

The field already accepts and respects a `value` prop.

### RTK Query: update `listPayees` response type

Add `default_category_id?: string` to the `Payee` model.

---

## Backend Tasks

### Migration: add `default_category_id` to payees

```sql
ALTER TABLE `payees`
    ADD COLUMN `default_category_id` VARCHAR(15) NULL
    AFTER `name`,
    ADD CONSTRAINT `fk_payees_category`
        FOREIGN KEY (`default_category_id`) REFERENCES `categories`(`id`)
        ON DELETE SET NULL;
```

### Update `POST /transactions` and `PUT /transactions/{id}`

After successfully inserting/updating a transaction that has both a `payee` and a `category_id`:
1. Find or create the payee record.
2. Set `payees.default_category_id = category_id` for that payee.

This means the learning happens automatically on every transaction save — no separate API call needed.

### Update `GET /payees` response

Include `default_category_id` in each payee object.

---

## i18n Keys

```
transactions.categoryAutoSelected
transactions.categoryAutoSelectedHint
```

---

## Acceptance Criteria

- [ ] After saving a transaction with payee "Starbucks" and category "Coffee", the next transaction for "Starbucks" pre-selects "Coffee".
- [ ] The auto-selection hint is visible but dismissible by selecting a different category.
- [ ] If the payee has no history, behavior is unchanged (auto-select first category).
- [ ] Changing the category on a transaction updates the payee's default for next time.
- [ ] Deleting a category sets `default_category_id` to NULL (via FK ON DELETE SET NULL).
- [ ] Feature works for both new and edited transactions.
