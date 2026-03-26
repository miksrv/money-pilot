# Feature 07 — Payees Management

## Goal

Expose the backend payee system in the frontend. Users can view all payees, rename them, merge duplicates, and delete unused ones. The transaction add/edit form should autocomplete payee names from this list.

The backend `PayeeController` already exists — this feature is primarily a frontend task.

---

## UI / UX Requirements

- Payees screen accessible from the Settings menu or a dedicated sidebar entry.
- List view with search, sorted by usage count descending.
- Inline rename or edit dialog.
- Merge flow: select two payees → merge into one.
- Delete only if `usage_count = 0`.
- Transaction form payee field: searchable autocomplete using `Select` component (with `searchable` + `onSearch` for server-side search).
- All UI via `simple-react-ui-kit`.

---

## Frontend Tasks

### New/Updated files

**New:**
- `client/src/screens/Settings/Payees/index.tsx` — payees management sub-screen (nested under Settings, or own route `/payees`)
- `client/src/screens/Settings/Payees/Payees.module.sass`

**Modified:**
- `client/src/api/api.ts` — add payee endpoints
- `client/src/components/CurrencyInput/` — (no change needed)
- Transaction add/edit form — replace plain `Input` for payee name with `Select` (searchable, server-side)

### Payees Screen Layout

**Header:** "Payees" title + search `Input`

**Table** (using `Table` component):
| Column | Notes |
|--------|-------|
| Name | Editable inline or via dialog |
| Usage count | `Badge` |
| Last used | Formatted date |
| Actions | Edit / Merge / Delete |

**Merge flow:**
1. Click "Merge" on a payee row → enters "merge mode".
2. Second payee row gets a "Merge into this" button.
3. Confirmation `Dialog` shows: "Merge [Payee A] into [Payee B]? All transactions from Payee A will be re-assigned to Payee B."
4. On confirm: `POST /payees/{id}/merge` → refresh list.

**Delete:** only shown when `usage_count = 0`. Confirmation `Dialog`.

### Transaction Form Autocomplete
Replace the payee `Input` in the transaction add/edit form with:
```tsx
<Select
    label={t('transactions.payee')}
    options={payeeOptions}
    searchable
    clearable
    onSearch={(text) => setPayeeSearch(text)}
    onSelect={(items) => setValue('payee_name', items?.[0]?.value ?? '')}
/>
```
- `payeeOptions` populated from `listPayees({ search: payeeSearch })`.
- Value is the payee name string (not ID), since transactions store payee names directly.
- Allow typing a new payee name that doesn't exist yet (free-text fallback).

### New RTK Query endpoints
```typescript
listPayees: builder.query<Payee[], { search?: string }>({
    query: (params) => ({ url: '/payees', params }),
    providesTags: ['Payee'],
})

updatePayee: builder.mutation<Payee, { id: string; name: string }>({
    query: ({ id, name }) => ({ url: `/payees/${id}`, method: 'PUT', body: { name } }),
    invalidatesTags: ['Payee'],
})

deletePayee: builder.mutation<void, string>({
    query: (id) => ({ url: `/payees/${id}`, method: 'DELETE' }),
    invalidatesTags: ['Payee'],
})

mergePayees: builder.mutation<void, { sourceId: string; targetId: string }>({
    query: ({ sourceId, targetId }) => ({
        url: `/payees/${sourceId}/merge`,
        method: 'POST',
        body: { target_id: targetId },
    }),
    invalidatesTags: ['Payee', 'Transaction'],
})
```

### Translations (i18n keys to add)
```
payees.title
payees.searchPayees
payees.noPayees
payees.usageCount
payees.lastUsed
payees.editPayee
payees.deletePayee
payees.mergePayee
payees.mergeConfirmTitle
payees.mergeConfirmBody
payees.deleteConfirmTitle
payees.deleteConfirmBody
payees.deleteBlockedBody
payees.newPayeePlaceholder
```

---

## Backend Tasks

### 1. Search param for `GET /payees`

Update `PayeeController::index()` to accept:
- `search` param: `LIKE %search%` on `name`
- `limit` param (default 50)

Sorted by `usage_count DESC` by default.

Response:
```json
[
    {
        "id": "...",
        "name": "Walmart",
        "usage_count": 42,
        "last_used": "2026-03-20"
    }
]
```

Add `last_used` via a JOIN on `transactions.date MAX`.

### 2. Merge endpoint

`POST /payees/{id}/merge`:
- Body: `{ "target_id": "uuid" }`
- Re-assign all transactions: `UPDATE transactions SET payee_name = (SELECT name FROM payees WHERE id = target_id) WHERE user_id = $userId AND payee_name = (SELECT name FROM payees WHERE id = $id)`.
- Update `usage_count` on target payee.
- Delete source payee.
- Return `HTTP 204`.

### 3. Delete endpoint — verify safety check

`DELETE /payees/{id}`:
- If `usage_count > 0`: return `HTTP 422 { "error": "payee_has_transactions" }`.
- Else: delete and return `HTTP 204`.

---

## Acceptance Criteria

- [ ] Payees list shows all payees with name, usage count, and last used date.
- [ ] Search filters payees by name in real time.
- [ ] Rename works and updates all display references.
- [ ] Merge re-assigns all transactions from the source payee and deletes the source.
- [ ] Delete is blocked when payee is in use, works when usage count is 0.
- [ ] Transaction form payee field autocompletes from the payees list.
- [ ] New payee names can still be typed freely (not limited to existing list).
- [ ] All strings translated.
