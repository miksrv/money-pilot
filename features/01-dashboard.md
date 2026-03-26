# Feature 01 — Dashboard

## Goal

Replace the empty Dashboard stub with a meaningful at-a-glance overview of the user's financial health: net worth, recent transactions, spending by category, and income vs. expense trends.

Inspired by: Copilot Money's home screen — summary cards at the top, charts in the middle, recent activity at the bottom.

---

## UI / UX Requirements

- Fully responsive: stacks vertically on mobile, multi-column grid on desktop (≥ 768 px).
- All components from `simple-react-ui-kit` (`Container`, `Table`, `Skeleton`, `Progress`, `Badge`, `Spinner`).
- Charts via `echarts-for-react`.
- Loading states: `Skeleton` placeholders for every card until data arrives.
- Empty states: friendly messages when there are no transactions or accounts.

---

## Screens & Layouts

### Summary Bar (top)
Three or four stat cards in a responsive flex/grid row:

| Card | Value | Detail |
|------|-------|--------|
| **Net Worth** | Sum of all account balances | Breakdown link → Accounts |
| **This Month — Spent** | Total expenses in current month | vs. last month (badge: up/down %) |
| **This Month — Income** | Total income in current month | vs. last month |
| **Savings Rate** | (income − expenses) / income × 100 % | — |

### Spending by Category (middle-left)
- Doughnut / pie chart (ECharts) showing expense breakdown for the current month.
- Legend below the chart with category emoji, name, amount, and `Progress` bar for budget consumption.
- Tap/click a slice → navigates to Transactions filtered by that category.

### Income vs. Expense — Bar Chart (middle-right)
- Grouped bar chart, last 6 months.
- Income bar (green) and expense bar (red) per month.
- Data from the `/dashboard/summary` endpoint.

### Recent Transactions (bottom)
- Last 5–10 transactions using `Table` from the UI kit.
- Columns: Date, Payee, Category (badge with emoji), Account, Amount (colored: red for expense, green for income).
- "View all" link → Transactions screen.

---

## Frontend Tasks

### New files
- `client/src/screens/Dashboard/index.tsx` — main screen component
- `client/src/screens/Dashboard/Dashboard.module.sass` — layout styles

### Modified files
- `client/src/api/api.ts` — add `getDashboardSummary` query endpoint
  ```
  GET /dashboard/summary?month=YYYY-MM
  ```

### Component breakdown
1. `<SummaryCards />` — 4 stat cards, data from `getDashboardSummary`
2. `<SpendingByCategoryChart />` — ECharts doughnut, data from `listCategories({ withSums: true })`
3. `<IncomeExpenseChart />` — ECharts grouped bar, data from `getDashboardSummary`
4. `<RecentTransactions />` — wraps `listTransactions` with `limit=10`

### State management
- No local Redux state needed — all data via RTK Query.
- `month` param defaults to current month; optional month-picker using `DatePicker` component.

### Translations (i18n keys to add)
```
dashboard.netWorth
dashboard.spentThisMonth
dashboard.incomeThisMonth
dashboard.savingsRate
dashboard.spendingByCategory
dashboard.incomeVsExpense
dashboard.recentTransactions
dashboard.viewAll
dashboard.noTransactions
dashboard.noAccounts
dashboard.vsLastMonth
```

---

## Backend Tasks

### New endpoint: `GET /dashboard/summary`

**Controller:** `server/app/Controllers/DashboardController.php` (new file)

**Route:** `$routes->get('dashboard/summary', 'DashboardController::summary');`

**Query params:**
- `month` (optional, default: current month, format `YYYY-MM`)

**Response shape:**
```json
{
    "net_worth": 12450.00,
    "current_month": {
        "income": 3200.00,
        "expenses": 1850.00,
        "savings_rate": 42.19
    },
    "previous_month": {
        "income": 3000.00,
        "expenses": 2100.00,
        "savings_rate": 30.00
    },
    "monthly_history": [
        { "month": "2025-10", "income": 3000.00, "expenses": 2100.00 },
        { "month": "2025-11", "income": 3100.00, "expenses": 1900.00 },
        { "month": "2025-12", "income": 2800.00, "expenses": 2200.00 },
        { "month": "2026-01", "income": 3200.00, "expenses": 1950.00 },
        { "month": "2026-02", "income": 3050.00, "expenses": 1800.00 },
        { "month": "2026-03", "income": 3200.00, "expenses": 1850.00 }
    ]
}
```

**Logic:**
1. Net worth: `SUM(balance)` from `accounts` where `user_id = $userId`.
2. Current-month income/expenses: `SUM(amount)` from `transactions` where `type IN ('income','expense')` and `date BETWEEN '${month}-01' AND last_day`.
3. Previous-month same query for comparison.
4. Monthly history: loop last 6 months.

**Auth:** protected (JWT filter — same as all other routes).

### Migration (none needed)
All data is derived from existing `accounts` and `transactions` tables.

---

## Acceptance Criteria

- [ ] Dashboard loads without errors when there are no accounts or transactions (empty state shown).
- [ ] Summary cards display correct values matching manual SQL queries.
- [ ] Spending chart shows only current-month expenses grouped by category.
- [ ] Income vs. expense chart shows last 6 months.
- [ ] Recent transactions table shows the 10 most recent entries.
- [ ] All text is translated (no hard-coded English strings in JSX).
- [ ] Skeleton placeholders visible during loading.
- [ ] Layout is usable on a 375 px wide mobile screen.
