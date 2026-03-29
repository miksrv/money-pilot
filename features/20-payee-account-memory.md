# Feature 20 — Payee → Account Memory

## Goal

When a user selects a payee in the transaction form, automatically pre-fill the **account** field with the last account used for that payee — exactly the same pattern already in place for category auto-fill via `default_category_id`.

---

## Context & Existing Pattern

The category auto-fill works like this today:

1. **DB:** `payees.default_category_id` — stores the last-used category per payee.
2. **Backend:** `TransactionController` updates `default_category_id` on every `create` and `update` transaction call (lines ~332 and ~460).
3. **Frontend:** `TransactionFormDialog` watches `currentPayee`, finds the matching payee object from `payeeOptions`, and calls `setValue('category_id', matched.default_category_id)`.

Feature 20 mirrors this **exactly** for `account_id`.

---

## Backend

### 1. Migration — add `default_account_id` to `payees`

New file: `server/app/Database/Migrations/<timestamp>_AddDefaultAccountIdToPayees.php`

```php
public function up()
{
    $this->db->query('
        ALTER TABLE `payees`
        ADD COLUMN `default_account_id` VARCHAR(15) NULL AFTER `default_category_id`,
        ADD CONSTRAINT `fk_payees_default_account`
            FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`)
            ON DELETE SET NULL
    ');
}

public function down()
{
    $this->db->query('ALTER TABLE `payees` DROP FOREIGN KEY `fk_payees_default_account`');
    $this->db->query('ALTER TABLE `payees` DROP COLUMN `default_account_id`');
}
```

### 2. `PayeeModel` — add to `$allowedFields`

```php
protected $allowedFields = [
    'name',
    'created_by_user_id',
    'is_approved',
    'usage_count',
    'default_category_id',
    'default_account_id',   // ← add
];
```

### 3. `PayeeController::index()` — include in response

In the `array_map` response builder, add:

```php
'default_account_id' => $row['default_account_id'],
```

Also update the `->select(...)` query to include `p.default_account_id`.

### 4. `TransactionController` — save `default_account_id` on create & update

**On create** (after finding/creating the payee, same block as `default_category_id` update):

```php
$updatePayload = ['default_category_id' => $input['category_id']];
if (!empty($input['account_id'])) {
    $updatePayload['default_account_id'] = $input['account_id'];
}
$payeeModel->update($payeeId, $updatePayload);
```

**On update** (same block as the existing `default_category_id` update for updates):

```php
$updatePayload = ['default_category_id' => $updateData['category_id']];
if (!empty($updateData['account_id'])) {
    $updatePayload['default_account_id'] = $updateData['account_id'];
}
$payeeModel->update($effectivePayeeId, $updatePayload);
```

> Only update when `account_id` is present and not a transfer (transfers have `to_account_id` too — check that `type !== 'transfer'` before saving, same guard as for category).

---

## Frontend

### 1. Update `ApiModel.Payee` type

In `client/src/api/types.ts` (or wherever `Payee` is defined), add:

```typescript
default_account_id?: string | null
```

### 2. `TransactionFormDialog.tsx` — extend the payee `useEffect`

The current effect (around line 56–66):

```typescript
useEffect(() => {
    if (props?.transactionData?.id || !currentPayee) {
        return
    }

    const matched = (payeeOptions ?? []).find((p) => p.name.toLowerCase() === currentPayee.toLowerCase())

    if (matched?.default_category_id) {
        setValue('category_id', matched.default_category_id, { shouldValidate: true })
    }
}, [currentPayee, payeeOptions])
```

Extend to:

```typescript
useEffect(() => {
    if (props?.transactionData?.id || !currentPayee) {
        return
    }

    const matched = (payeeOptions ?? []).find((p) => p.name.toLowerCase() === currentPayee.toLowerCase())

    if (matched?.default_category_id) {
        setValue('category_id', matched.default_category_id, { shouldValidate: true })
    }

    if (matched?.default_account_id) {
        setValue('account_id', matched.default_account_id, { shouldValidate: true })
    }
}, [currentPayee, payeeOptions])
```

No other frontend changes are needed — `AccountSelectField` already reads `account_id` from the form state.

---

## Edge Cases

| Scenario | Behaviour |
|---|---|
| Transfer transaction | Do **not** update `default_account_id` (transfers have special semantics). Guard: `type !== 'transfer'`. |
| Account deleted | FK is `ON DELETE SET NULL` — auto-cleared in DB. Frontend ignores `null` gracefully (no `setValue` call). |
| User manually changes account | On next save, `default_account_id` is updated to the new selection. |
| New payee (no history) | No pre-fill — fields stay at their defaults (first account auto-selected by `AccountSelectField`). |

---

## Acceptance Criteria

- [ ] `payees.default_account_id` column added via migration.
- [ ] `PayeeController` returns `default_account_id` in the payee list response.
- [ ] `TransactionController` updates `default_account_id` on transaction create and update (non-transfer only).
- [ ] Selecting a known payee in the transaction form auto-fills `account_id` (if a default exists).
- [ ] Account auto-fill does **not** trigger for transfers.
- [ ] Deleting an account nullifies `default_account_id` via FK cascade — no crash on frontend.
- [ ] Manually changing the account after payee selection works; the new account is saved as the new default on submit.
