---
name: Phase 2 — Features 06–08 Decisions
description: Implementation decisions and patterns from Features 06 (Recurring), 07 (Payees), 08 (Reports) backend work
type: project
---

## Feature 06 — Recurring Transactions

**Why:** Allow users to define repeating income/expense rules that generate real transactions on demand or automatically.

- New table `recurring_transactions` — migration `2026-03-25-100000_CreateRecurringTransactionsTable` (batch 3).
- Fields: `id`, `user_id`, `name`, `type`, `amount`, `account_id`, `category_id`, `payee_name`, `notes`, `frequency`, `start_date`, `end_date`, `next_due_date`, `is_active`, `auto_create`.
- `frequency` ENUM: `daily`, `weekly`, `biweekly`, `monthly`, `quarterly`, `yearly`.
- `$returnType = 'array'` on `RecurringTransactionModel` (not Entity — no entity class created).
- `getNextDueDate(frequency, from)` uses `\DateTime::modify()` to advance by frequency.
- `getDueToday(userId)` uses `groupStart/groupEnd` for the `(end_date IS NULL OR end_date >= CURDATE())` condition.
- `create()` sets `next_due_date = start_date` on insert.
- `update()` recomputes `next_due_date` if `start_date` or `frequency` changes: start_date change resets to new start_date; frequency-only change recomputes from current next_due_date.
- `generate()` creates a real transaction then advances `next_due_date`.
- `toggle()` flips `is_active` 0↔1.
- `createTransactionFromRule()` is a public shared method (used by controller + spark command) — mirrors `TransactionController::create` logic: fetch account, compute balance, get/create payee via `PayeeModel::getOrCreateByName`, insert transaction, update account balance. Uses `next_due_date` as the transaction date.
- Spark command `recurring:process` in `App\Commands\ProcessRecurring` — `group='Finance'`, `name='recurring:process'`. Queries `auto_create=1 AND is_active=1 AND next_due_date <= today` directly (not via `getDueToday` which is user-scoped). Uses `CLI::write()` with colour.

**Gotcha:** `protected $model` cannot be typed in controllers that extend `ResourceController` (parent declares it untyped). Remove the typed property declaration and assign directly in constructor.

## Feature 07 — Payees Management

**Why:** Expose payee management UI with usage stats, safe delete, and merge capability.

- `PayeeController` rewritten to extend `ApplicationBaseController` with `new Auth()` constructor pattern (was using static `Auth::getUserIdFromToken()`).
- `index()` now uses raw `db_connect()` query builder with LEFT JOIN on `transactions` to compute `last_used = MAX(t.date)` per payee. Supports `?search=` (LIKE on name) and `?limit=` (default 100, max 500). Sorted by `usage_count DESC`.
- `delete()` now blocks with 422 `payee_has_transactions` if usage count > 0 (checked via `db_connect()->table('transactions')->where('payee_id')->countAllResults()`).
- New `merge($id)` — POST /payees/{id}/merge — body `{target_id}`:
  1. Validates source and target exist and are different
  2. `UPDATE transactions SET payee_id = target_id WHERE payee_id = source_id`
  3. Recounts target usage_count from transactions table
  4. Deletes source payee
  5. Returns HTTP 204 (empty body via `$this->respond(null, 204)`)
- Payees are NOT user-scoped (no `user_id` FK on payees table) — index returns global payees.

## Feature 08 — Reports & Analytics

**Why:** Provide aggregated financial reporting for the Reports/Analytics screen.

- New `ReportsController` — all endpoints auth-guarded, no model property needed.
- `getDateRange()` private helper: defaults `date_from` to first of current month, `date_to` to last of current month. Swaps if date_from > date_to.
- `spendingByCategory()` — LEFT JOIN categories, group by category_id, order by total DESC.
- `incomeExpense()` — uses `DATE_FORMAT(date, '%Y-%m')` for month grouping; `net = income - expenses` computed in PHP.
- `spendingTrend()` — daily expense totals with running cumulative sum computed in PHP via reference variable.
- `netWorth()` — walks month-end dates using `\DateTime::modify('first/last day of this month')`. For each month-end: current_balance - income_after_month_end + expenses_after_month_end. Month label is `substr($monthEnd, 0, 7)` (YYYY-MM).
- `topPayees()` — LEFT JOIN payees, group by payee_id, LIMIT 10, expense only.
- All five report endpoints have matching OPTIONS routes registered.
