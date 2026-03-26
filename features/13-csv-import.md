# Feature 13 — CSV Transaction Import

## Goal

Allow users to upload a bank statement CSV and bulk-import transactions. This is the most-requested missing feature — it eliminates the need to manually enter historical data and enables users to switch to Money Pilot from other tools.

---

## User Flow

1. User navigates to **Transactions → "Import CSV"** button (or **Settings → Import Data**).
2. User uploads a `.csv` file (drag-and-drop or file picker).
3. App parses the CSV in the browser and shows a **column mapping screen**:
   - User maps CSV columns → app fields (date, payee, amount, type, notes).
   - Preview of first 5 rows with mapped data.
4. User sets **import options**: account to assign, default category (optional), date format hint.
5. User clicks **Import**. Backend processes the file.
6. App shows a results summary: "X transactions imported, Y skipped (duplicates)."

---

## Duplicate Detection

A transaction is considered a duplicate if another transaction exists with the same:
- `account_id` + `date` + `amount` + `payee` (fuzzy: normalized lowercase, stripped punctuation)

Duplicates are skipped by default; user can override with a checkbox "Import duplicates anyway."

---

## Frontend Tasks

### New screen: `client/src/screens/import/Import.tsx`

Phases rendered as a multi-step form (no route change between steps — use local state):

**Step 1 — Upload**
- `<input type="file" accept=".csv">` wrapped in a drag-and-drop zone.
- Parse CSV client-side using a lightweight library (e.g., `papaparse`).
- Validate: must have at least 2 columns and 1 data row.

**Step 2 — Map columns**
- Show detected column headers as `Select` dropdowns: "Which column is the Date?", "Which is the Amount?", etc.
- Required mappings: Date, Amount.
- Optional: Payee, Notes, Type (income/expense).
- Live preview table showing first 5 rows with mapped values.

**Step 3 — Options**
- `AccountSelectField` for account assignment (required).
- `CategorySelectField` for default category (optional).
- Date format selector (auto-detect with manual override).
- "Skip duplicates" checkbox (default: on).
- "Mark all as expense / income" toggle if no type column.

**Step 4 — Results**
- Show import summary: imported count, skipped count, error rows.
- Link to Transactions screen filtered to the import date.

### New RTK Query endpoint

```typescript
importTransactions: builder.mutation<ImportResult, ImportRequest>({
    query: (body) => ({ url: 'transactions/import', method: 'POST', body }),
    invalidatesTags: ['Transaction', 'Dashboard'],
})
```

Request shape:
```typescript
interface ImportRequest {
    account_id: string
    category_id?: string
    skip_duplicates: boolean
    rows: Array<{
        date: string        // YYYY-MM-DD
        amount: number
        type: 'income' | 'expense'
        payee?: string
        notes?: string
    }>
}
```

Response shape:
```typescript
interface ImportResult {
    imported: number
    skipped: number
    errors: Array<{ row: number; reason: string }>
}
```

---

## Backend Tasks

### New endpoint: `POST /transactions/import`

**Controller:** `TransactionController::import()`

**Logic:**
1. Validate request: `account_id` required, rows array required, each row validated.
2. For each row:
   a. Check duplicate: same account + date + amount + payee (normalized). Skip if found and `skip_duplicates = true`.
   b. Insert transaction row.
   c. Update account balance.
3. Return `{ imported, skipped, errors }`.

**Performance:** Process in a DB transaction for atomicity. Commit all or roll back on fatal error. Limit: max 1000 rows per import.

### New route

```php
$routes->post('transactions/import', 'TransactionController::import');
```

---

## i18n Keys

```
import.title
import.step1_title
import.step2_title
import.step3_title
import.step4_title
import.upload_hint
import.column_date
import.column_amount
import.column_payee
import.column_notes
import.column_type
import.account_label
import.category_label
import.skip_duplicates
import.date_format
import.import_button
import.result_imported
import.result_skipped
import.result_errors
import.view_transactions
```

---

## Acceptance Criteria

- [ ] User can upload a CSV and see a column mapping interface.
- [ ] Required columns (date, amount) must be mapped before proceeding.
- [ ] Preview shows correct data with the current mapping.
- [ ] Import correctly creates transactions in the selected account.
- [ ] Account balance is updated after import.
- [ ] Duplicate rows are skipped (when option is enabled) with correct count reported.
- [ ] Import of 500 rows completes in under 10 seconds.
- [ ] Errors (invalid date format, missing amount) are reported per row without aborting the entire import.
- [ ] All strings translated.
- [ ] Screen is usable on mobile (upload + options at minimum; mapping table may require horizontal scroll).
