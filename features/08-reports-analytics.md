# Feature 08 — Reports & Analytics

## Goal

A dedicated Reports screen with deeper financial insights beyond the Dashboard: spending trends over time, income vs. expense comparison, category-level drill-down, and net worth history. All charts use ECharts via `echarts-for-react`.

---

## UI / UX Requirements

- Responsive: charts stack vertically on mobile, side-by-side on desktop.
- Date range picker at the top (uses `DatePicker` with preset ranges: This Month, Last Month, Last 3 Months, Last Year, Custom).
- Charts use the app's color variables (adapts to dark/light theme).
- Drill-down: click a category in a chart → see that category's transactions for the period.
- Export button: download visible data as CSV.
- All UI via `simple-react-ui-kit`.

---

## Report Sections

### 1. Spending by Category — Doughnut Chart
- For the selected period.
- Slice per category with emoji + name + amount.
- Legend on the right (desktop) or below (mobile).
- Click slice → transaction drill-down panel/dialog.

### 2. Income vs. Expense — Area/Bar Chart
- Monthly bars for the selected date range.
- Two series: Income (green) and Expense (red).
- Net savings line overlay.

### 3. Spending Trend — Line Chart
- Daily cumulative spending for the selected month.
- Useful to see if spending accelerates toward month-end.

### 4. Net Worth Over Time — Area Chart
- One data point per month (end-of-month balance across all accounts).
- Requires storing or computing historical balance snapshots.

### 5. Top Payees Table
- Top 10 payees by total spending in the selected period.
- `Table` component: rank, payee name, transaction count, total amount.

---

## Frontend Tasks

### New files
- `client/src/screens/Reports/index.tsx`
- `client/src/screens/Reports/Reports.module.sass`
- `client/src/screens/Reports/components/SpendingByCategoryChart.tsx`
- `client/src/screens/Reports/components/IncomeExpenseChart.tsx`
- `client/src/screens/Reports/components/SpendingTrendChart.tsx`
- `client/src/screens/Reports/components/NetWorthChart.tsx`
- `client/src/screens/Reports/components/TopPayeesTable.tsx`

### Modified files
- `client/src/api/api.ts` — add reports endpoints
- `client/src/screens/` — add Reports route in the router

### New RTK Query endpoints
```typescript
getSpendingByCategory: builder.query<CategorySpend[], ReportParams>({
    query: (params) => ({ url: '/reports/spending-by-category', params }),
})

getIncomeExpense: builder.query<MonthlyIncomeExpense[], ReportParams>({
    query: (params) => ({ url: '/reports/income-expense', params }),
})

getSpendingTrend: builder.query<DailySpend[], ReportParams>({
    query: (params) => ({ url: '/reports/spending-trend', params }),
})

getNetWorth: builder.query<MonthlyNetWorth[], ReportParams>({
    query: (params) => ({ url: '/reports/net-worth', params }),
})

getTopPayees: builder.query<PayeeSpend[], ReportParams>({
    query: (params) => ({ url: '/reports/top-payees', params }),
})
```

```typescript
interface ReportParams {
    date_from: string   // YYYY-MM-DD
    date_to: string     // YYYY-MM-DD
}
```

### CSV Export
- "Export CSV" `Button` at top-right of each section.
- Client-side: convert the RTK Query result to CSV string and trigger a download via `URL.createObjectURL(blob)`.
- No backend endpoint needed for MVP.

### Translations (i18n keys to add)
```
reports.title
reports.period
reports.spendingByCategory
reports.incomeVsExpense
reports.spendingTrend
reports.netWorthHistory
reports.topPayees
reports.exportCsv
reports.noData
reports.income
reports.expense
reports.netSavings
reports.rank
reports.payee
reports.transactions
reports.total
```

---

## Backend Tasks

### New controller: `server/app/Controllers/ReportsController.php`

Apply JWT filter. All routes scoped to authenticated user.

### Endpoints

#### `GET /reports/spending-by-category`
Params: `date_from`, `date_to`

```json
[
    { "category_id": "...", "category_name": "Groceries", "emoji": "🛒", "color": "#4bb34b", "total": 320.00, "count": 14 }
]
```

SQL: `GROUP BY category_id`, filter `type = 'expense'` and date range.

#### `GET /reports/income-expense`
Params: `date_from`, `date_to`

```json
[
    { "month": "2025-10", "income": 3200.00, "expenses": 1850.00, "net": 1350.00 }
]
```

SQL: GROUP BY `DATE_FORMAT(date, '%Y-%m')`, SUM split by type.

#### `GET /reports/spending-trend`
Params: `date_from`, `date_to`

```json
[
    { "date": "2026-03-01", "amount": 45.00, "cumulative": 45.00 },
    { "date": "2026-03-02", "amount": 120.00, "cumulative": 165.00 }
]
```

SQL: Daily totals with running cumulative sum (compute in PHP).

#### `GET /reports/net-worth`
Params: `date_from`, `date_to`

```json
[
    { "month": "2025-10", "net_worth": 10200.00 },
    { "month": "2025-11", "net_worth": 11050.00 }
]
```

**Approach (MVP):** compute end-of-month balance by replaying transactions up to that point. Start from current `account.balance` and subtract/add transactions that occurred after each month's end. This is accurate without needing a snapshot table.

#### `GET /reports/top-payees`
Params: `date_from`, `date_to`, `limit` (default 10)

```json
[
    { "payee_name": "Walmart", "total": 680.00, "count": 12 }
]
```

SQL: GROUP BY `payee_name` WHERE `type = 'expense'`, ORDER BY total DESC, LIMIT 10.

### Routes
```php
$routes->get('reports/spending-by-category', 'ReportsController::spendingByCategory');
$routes->get('reports/income-expense', 'ReportsController::incomeExpense');
$routes->get('reports/spending-trend', 'ReportsController::spendingTrend');
$routes->get('reports/net-worth', 'ReportsController::netWorth');
$routes->get('reports/top-payees', 'ReportsController::topPayees');
```

---

## Acceptance Criteria

- [ ] All charts render correctly for the selected date range.
- [ ] Date range picker presets (This Month, Last 3 Months, etc.) update all charts simultaneously.
- [ ] Clicking a category slice opens a drill-down showing that category's transactions.
- [ ] Net worth history chart shows sensible values.
- [ ] Top payees table is sorted by total descending.
- [ ] CSV export downloads a valid file for each section.
- [ ] Charts adapt to dark/light theme colors.
- [ ] All charts display a "no data" state gracefully.
- [ ] Layout is usable on mobile (charts scroll horizontally if needed).
- [ ] All strings translated.
