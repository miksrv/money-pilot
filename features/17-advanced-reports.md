# Feature 17 — Advanced Reports & Analytics

## Goal

Extend the Reports screen with three capabilities that turn raw data into actionable insight: budget vs actual overlay, spending forecasts, and drill-down from charts into the underlying transactions.

---

## 17.1 — Budget vs Actual Overlay

### User story
As a user I want to see my actual spending plotted against my budgeted amounts in the same chart, so I can instantly see where I'm over or under budget.

### Design

In the **Spending by Category** section of Reports:

Add a toggle: "Show budget" (default: off). When on:
- The doughnut chart switches to a horizontal bar chart.
- Each category gets two bars: "Actual" (solid, category color) and "Budget" (outlined/hatched, same color at 40% opacity).
- Categories without a budget are still shown (budget bar = 0).
- A summary line above the chart: "Total budgeted: $2,000 / Total spent: $1,840 (−8%)"

The bar chart is only shown for expense categories.

### Backend

No new endpoints. `GET /categories?withSums=true` already returns `budget` and `expenses` per category.

For the Reports date range (not just current month), extend `GET /reports/spending-by-category` to return `budget` per category alongside the period expenses.

---

## 17.2 — Spending Forecast

### User story
As a user I want to see a projection of where my spending will end up by month-end based on current trends, so I can adjust before it's too late.

### Design

In the **Spending Trend** section of Reports:

When the selected period includes the current month:
- Extend the line chart with a dashed continuation line from "today" to end-of-month.
- The projected amount is calculated as: `current_spending / days_elapsed * days_in_month`.
- A label at the projected end-point: "Projected: $2,100" with a color based on budget comparison.
- Show a secondary note: "Based on daily average of $X over the last N days."

This is a pure frontend calculation — no new API endpoints needed.

### Frontend

`client/src/screens/reports/utils.ts` — add `calculateForecast(currentAmount, daysElapsed, totalDays): number`.

`SpendingTrendChart` (when built / in Reports.tsx) — add the dashed forecast series to the ECharts config when the period includes today.

---

## 17.3 — Drill-Down: Chart → Transactions

### User story
As a user I want to click on a category slice in the spending chart and see the individual transactions that make up that total, so I can understand what's driving my spending.

### Design

**Spending by Category chart (Dashboard and Reports):**
- Clicking a category slice / legend item navigates to Transactions with pre-applied filters:
  - `category_id` = clicked category
  - `date_from` / `date_to` = current report period
- On Dashboard: uses `navigate('/transactions?category_id=XXX&date_from=YYY&date_to=ZZZ')`.
- On Reports: same navigation with the active date range.

**Income vs Expense bar chart:**
- Clicking a bar (month column) navigates to Transactions filtered to that month + type (income or expense based on which bar was clicked).

### Frontend

**`SpendingByCategoryChart.tsx`** — add `onClick` handler to both the ECharts `series` click event and legend items. Call `navigate` with correct query params.

**`IncomeVsExpenseChart.tsx`** — add `onClick` to ECharts `series` click event.

**`Transactions.tsx`** — already reads filters from URL query params. No changes needed.

---

## 17.4 — Interactive Chart Legends

### User story
As a user I want to click legend items in charts to show/hide individual series, so I can focus on specific data.

### Design

ECharts supports this natively via `legend.selected` and the `legendselectchanged` event. Currently the legends are display-only.

Enable click-to-toggle for all charts by setting:
```javascript
legend: {
    ...baseConfig.legend,
    selectedMode: true,
}
```

Clicking a legend item toggles the corresponding series visibility. This is a one-line change per chart.

---

## 17.5 — Key Insights Panel

### User story
As a user I want a plain-language summary of notable patterns in the selected period, so I don't have to interpret charts myself.

### Design

Below the date range selector in Reports, add a `<Container>` titled "Key Insights" with 3-5 auto-generated bullet points:

| Insight type | Example |
|---|---|
| Biggest category | "Food was your largest expense category: $480 (26% of spending)" |
| Month-over-month change | "Entertainment spending increased 45% vs last month" |
| Budget performance | "You stayed within budget in 4 of 6 categories" |
| Top payee | "Amazon was your most frequent payee: 12 transactions" |
| Savings rate | "Your savings rate of 18% is your best in 3 months" |

Insights are computed client-side from the data already fetched for the charts. No new API calls.

### Frontend

New component: `client/src/screens/reports/InsightsPanel.tsx`

Props:
```typescript
interface InsightsPanelProps {
    categories: ApiModel.Category[]
    transactions: ApiModel.Transaction[]
    previousPeriodCategories: ApiModel.Category[]
    topPayees: ApiModel.TopPayee[]
}
```

Returns an array of insight strings. Renders as a `<Container>` with a `<ul>` list.

---

## Backend Tasks

### Extend `GET /reports/spending-by-category`

Add `budget` field per category to the response so budget vs actual is available for any date range (not just current month).

```json
{
    "categories": [
        {
            "id": "...",
            "name": "Food",
            "color": "green",
            "icon": "🍔",
            "total": 480.00,
            "budget": 500.00
        }
    ]
}
```

---

## i18n Keys

```
reports.budgetOverlay
reports.budgetOverlayToggle
reports.totalBudgeted
reports.totalSpent
reports.forecast
reports.projectedBy
reports.projectedAmount
reports.dailyAverage
reports.insights
reports.insightTopCategory
reports.insightBudgetPerformance
reports.insightSavingsRate
```

---

## Acceptance Criteria

- [ ] Budget vs actual toggle shows horizontal bar chart with actual and budget bars per category.
- [ ] Forecast dashed line extends to end-of-month when the current period includes today.
- [ ] Clicking a category slice on Dashboard navigates to Transactions filtered to that category + month.
- [ ] Clicking a category in Reports navigates with the active date range applied.
- [ ] Clicking a bar in the Income vs Expense chart navigates to the correct month + type.
- [ ] All chart legends are click-to-toggle.
- [ ] Key Insights panel shows at least 3 auto-generated insights for any period with data.
- [ ] All strings translated.
