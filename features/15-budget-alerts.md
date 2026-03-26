# Feature 15 — Budget Alerts & Notifications

## Goal

Proactively warn users when their spending is approaching or has exceeded a category budget. Currently, budget progress is only visible when the user actively visits the Categories screen — alerts bring it to their attention passively.

---

## Alert Thresholds

| State | Threshold | Color | Label |
|-------|-----------|-------|-------|
| On track | < 80 % of budget | Green | — (no alert) |
| Warning | 80–99 % of budget | Orange | "Approaching limit" |
| Over budget | ≥ 100 % of budget | Red | "Over budget" |

Thresholds are not user-configurable in the MVP. Future versions may allow per-category threshold customization.

---

## UI Surfaces

### 1. Dashboard — budget warning banner

Below the summary cards, render a dismissible `<Message type='warning'>` listing categories that are at or over budget:

```
⚠ Budget alert: Food is at 92%, Entertainment is over budget (112%)
```

- Show only when at least one category is ≥ 80 %.
- Each category name links to the Categories screen.
- Dismissed per session (not persisted) — reappears on next page load if still over.
- Show at most 3 categories; "and 2 more…" for additional.

### 2. Dashboard — summary card badge

The "Spent This Month" summary card gains a warning badge in the top-right corner when any category is over budget:

```
Spent This Month   [!]
$1,840
↑ 8% vs last month
```

Badge: orange `!` icon. Tooltip on hover: "2 categories over budget".

### 3. Categories screen — warning badges on rows

Each category row in `CategoriesTable` with spending ≥ 80 % gains a colored `Badge` in the row:

| State | Badge |
|-------|-------|
| 80–99 % | `<Badge type='orange'>Near limit</Badge>` |
| ≥ 100 % | `<Badge type='red'>Over budget</Badge>` |

This replaces the purely color-based progress bar as the primary indicator.

### 4. Transaction form — budget hint

When the user selects a category in `TransactionFormDialog`, show a one-line budget status below the category field:

- "Food: $320 of $500 budget used this month (64 %)" — green
- "Food: $430 of $500 budget used this month (86 %)" — orange
- "Food: $560 of $500 budget — over by $60" — red

This requires the selected category's `expenses` and `budget` values. The `listCategories({ withSums: true })` query already returns this data.

---

## Frontend Tasks

### New component: `client/src/components/budget-alert-banner/BudgetAlertBanner.tsx`

Props:
```typescript
interface BudgetAlertBannerProps {
    categories: ApiModel.Category[]
}
```

Filters categories where `expenses / budget >= 0.8` and `budget > 0`. Renders `<Message type='warning'>` with category links. Returns `null` if no alerts.

### Modified: `client/src/screens/dashboard/Dashboard.tsx`

- Import `BudgetAlertBanner`.
- Pass `categories` from `listCategories({ withSums: true })`.
- Render between summary cards and charts.

### Modified: `client/src/components/summary-card/SummaryCard.tsx`

- Add optional `warningCount?: number` prop.
- When `warningCount > 0`, show a small orange `Badge` in the card corner.

### Modified: `client/src/screens/dashboard/Dashboard.tsx`

- Compute `warningCategoryCount` from categories.
- Pass to the "Spent This Month" `SummaryCard`.

### Modified: `client/src/components/categories-table/CategoriesTable.tsx`

- In `renderChildRow` and `renderStandaloneRow`, compute percentage.
- When ≥ 80 %: add `Badge` after the category name.

### Modified: `client/src/components/transaction-table/TransactionFormDialog.tsx`

- When `category_id` changes, look up the selected category from the `allCategories` list (already fetched).
- If the category has `budget > 0`, render a one-line budget hint below the `CategorySelectField`.

---

## Backend Tasks

None for MVP. All data is already available via `GET /categories?withSums=true`.

Future: push notifications (email / web push) when a budget threshold is crossed — requires a background job and notification infrastructure.

---

## i18n Keys

```
budgetAlert.title
budgetAlert.approaching
budgetAlert.overBudget
budgetAlert.andMore
budgetAlert.categoryHint
budgetAlert.overBy
budgetAlert.of
budgetAlert.usedPercent
```

---

## Acceptance Criteria

- [ ] Dashboard shows a warning banner when any category is ≥ 80 % of budget.
- [ ] Banner lists category names with links to the Categories screen.
- [ ] "Spent This Month" card shows a warning badge when budgets are exceeded.
- [ ] CategoriesTable rows show colored badges for near-limit and over-budget categories.
- [ ] Transaction form shows budget status when an expense category with a budget is selected.
- [ ] No alerts shown when user has no categories with budgets set.
- [ ] All UI is responsive at 320 px.
- [ ] All strings translated.
