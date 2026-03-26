---
name: Phase 1 MVP — Features 02–05 Decisions
description: Implementation decisions, bugs fixed, and patterns established during Features 02–05 backend work
type: project
---

## Feature 02 — Transactions

**Why:** Complete transaction CRUD with balance side-effects, pagination, and search.

- `delete()` now reverses the account balance (expense adds back, income subtracts).
- `index()` replaced with paginated query builder approach (raw `db_connect()` builder, not model) returning `{ data: [...], meta: { total, page, limit, pages } }`.
- `notes` added to `TransactionModel::$allowedFields` and `$validationRules` (permit_empty).
- `create()` now passes `notes` through to the insert.
- Filters supported: `page`, `limit`, `search` (LIKE on payee name + notes), `date_from`, `date_to`, `type`, `account_id`, `category_id`.

## Feature 03 — Accounts

**Why:** Prevent orphaned transaction data; surface transaction counts in UI.

- `delete()` now blocks with 422 `account_has_transactions` if `transactions` table has rows for that account.
- `index()` now returns `transaction_count` per account (inline `countAllResults()`).
- `create()` bug fixed: was using `$input['name']` for `institution` — corrected to `$input['institution'] ?? null`.
- `update()` now returns the updated account object instead of 204 no-body.

## Feature 04 — Categories

**Why:** Support archiving categories and prevent data loss on delete.

- Migration `2026-03-25-000001_AddArchivedToCategories` adds `archived TINYINT(1) DEFAULT 0` after `usage_count`. Run batch 2.
- `archived` added to `CategoryModel::$allowedFields`.
- `delete()` now blocks with 422 `category_has_transactions` if used by any transaction.
- New `archive()` method on `PATCH /categories/{id}/archive` — accepts `{ "archived": true|false }`, defaults to `true`.
- `index()` filters out archived by default; pass `?include_archived=1` to include them.
- `index()` now returns `transaction_count` and `archived` fields on every item.

## Feature 05 — Settings / UserController

**Why:** Allow users to manage their profile and account from the Settings screen.

- New controller `UserController` (no model property — uses `UserModel` inline).
- `GET /users/profile` — returns id, name, email, phone, created_at.
- `PUT /users/profile` — updates name + phone; validates name not empty.
- `PUT /users/password` — verifies current password, updates hash, invalidates ALL sessions via `SessionModel::deleteByUserId()`.
- `DELETE /users/me` — hard deletes all user data in FK-safe order: sessions → transactions → accounts → categories → payees → users.
- All OPTIONS routes registered for profile, password, me.
