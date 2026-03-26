# Feature 11 — UX Polish & Accessibility Pass

## Goal

Systematically address cross-cutting UI/UX deficiencies identified in the March 2026 audit: color-only indicators, keyboard navigation gaps, missing ARIA attributes, mobile responsiveness issues, and inconsistent loading/empty states.

---

## Priority 1 — Color-Independent Indicators

Every place the app currently uses color as the sole differentiator must gain a text or icon supplement.

| Location | Current | Fix |
|----------|---------|-----|
| Accounts — balance | Red/green text only | Add `(−)` prefix or `↓`/`↑` icon |
| Categories — progress bar | Red/orange/green bar only | Add text: "80 % of budget" below bar |
| Transactions — income/expense amount | Color only | Add `+` prefix for income, `−` for expense |
| Summary cards — change badge | Color only | Add `↑`/`↓` icon alongside percentage |
| Categories — archived rows | Opacity reduction only | Add `Archived` `Badge` on the row |

---

## Priority 2 — Keyboard Navigation

| Component | Issue | Fix |
|-----------|-------|-----|
| `CategoryPicker` (inline transaction table) | Mouse-only | Add `Tab`/`Enter`/`Escape` support; trap focus inside popout |
| `CategoriesTable` parent rows | Tab navigation skips rows | Ensure all `role="button"` elements are in tab order |
| `AppLayout` sidebar | No skip link | Add `<a href="#main" className="sr-only focusable">Skip to main content</a>` |
| Account popout menus | No keyboard path to open | Add `Enter`/`Space` to trigger three-dot button; `Escape` to close |
| Recurring table actions | Icon-only buttons | Add `aria-label` to every icon-only `Button` |
| `EmojiPicker` grid | No keyboard grid nav | Add arrow-key navigation through emoji grid |

---

## Priority 3 — ARIA & Semantic HTML

### Global changes

- All `<div role="button">` with `tabIndex` must have `onKeyDown` for Enter/Space (audit entire codebase).
- Error and success `<Message>` components must have `role="alert"` (or `role="status"` for non-critical).
- Every form's `<Input label="X">` must verify the label is properly linked (check `simple-react-ui-kit` renders `for`/`id` pair).
- Chart containers (`<div>` wrapping ECharts) need `aria-label="Chart: Spending by category"` and `role="img"`.
- Date-group headers in `TransactionTable` (`<div className={styles.dateHeader}>`) must use `<h3>` or `role="heading" aria-level="3"`.

### Screen-specific

| Screen | Change |
|--------|--------|
| Login / Register | `autocomplete="email"` on email input; `autocomplete="current-password"` / `"new-password"` on password; password toggle button needs `aria-label="Show password"` / `"Hide password"` |
| Settings — messages | Success/error messages need `role="status"` |
| AppBar — hamburger | SVG icon needs `aria-hidden="true"`; button label should read `"Open menu"` / `"Close menu"` based on state |
| AppLayout — eye icon | Decorative emoji in group banner needs `aria-hidden="true"` |
| CategoriesTable — color dot | `<span style={{ backgroundColor: … }}>` needs `aria-label={category.color}` or `title={category.color}` |

---

## Priority 4 — Mobile Responsiveness

| Screen | Issue | Fix |
|--------|-------|-----|
| Transactions filter bar | Flex-wrap causes inputs to squish below 480 px | Collapse filters behind a "Filters" `Button` + `Dialog` on mobile |
| Categories table | All 4 columns visible at 320 px — unreadable | Hide "Budget" column below 600 px; hide "Progress" below 480 px |
| Reports charts | Full-width charts unreadable at 320 px | Show a simplified table view when width < 480 px |
| Account cards | Grid 2-col on tablet → 1-col below 600 px (OK), but card heights vary | Use `align-items: stretch` so cards in same row are equal height |
| Summary cards | 4 cards → 2×2 on tablet → 1-col on mobile (OK), but text can overflow | Add `text-overflow: ellipsis` and `white-space: nowrap` on value |
| Login / Register brand panel | Removed on mobile; users see no branding | Add a compact brand header (logo + name only) above the card on mobile instead of removing entirely |

---

## Priority 5 — Touch Targets

All interactive elements must have a minimum 44×44 px touch target on mobile.

| Element | Current size | Fix |
|---------|-------------|-----|
| Checkboxes in `TransactionTable` | 16×16 px | Wrap in a `<label>` with `padding: 14px` |
| Expand/collapse chevron in `CategoriesTable` | ~16 px | Increase to 32 px with padding |
| Category color dot in row | 6×6 px (decorative only) | No change needed — not interactive |
| Password show/hide toggle | ~30 px | Set `min-height: 44px; min-width: 44px` |
| Three-dot account menu button | ~24 px | Set `padding: 10px` |

---

## Priority 6 — Loading & Empty States

### Standardize loading indicators

| Context | Current | Standard |
|---------|---------|----------|
| Buttons during mutation | Some show `"..."`, some show `"Loading..."` | Use `loading={isLoading}` prop on `Button` (already supported); label stays as-is |
| Infinite scroll in Transactions | Silent sentinel div | Add `<Spinner />` below the list while `isFetching` |
| Initial page load | Mixed skeleton vs spinner | Use `Skeleton` for content layout, `Spinner` for non-layout elements |

### Empty states with action guidance

Every screen's empty state must include a primary action button directing the user to the next step:

| Screen | Empty message | Action |
|--------|--------------|--------|
| Transactions | "No transactions yet" | `Button` → open add-transaction form |
| Categories | "No categories yet" | `Button` → open add-category form |
| Accounts | "No accounts yet" | `Button` → open add-account form |
| Recurring | "No recurring transactions" | `Button` → open add-recurring form |
| Payees | "No payees found" | Explain payees are created from transactions |
| Dashboard | No accounts/transactions | Onboarding prompt (see Feature 12) |

---

## Acceptance Criteria

- [ ] No interactive element relies on color alone to convey state.
- [ ] Every focusable element is reachable and operable via keyboard only.
- [ ] Lighthouse Accessibility score ≥ 90 on Dashboard, Transactions, Categories screens.
- [ ] All buttons have a visible focus ring (not overridden by CSS reset).
- [ ] All icon-only buttons have `aria-label`.
- [ ] Error and success messages are announced to screen readers (`role="alert"` / `role="status"`).
- [ ] Transactions and Categories screens are usable on a 320 px viewport.
- [ ] All interactive touch targets are ≥ 44×44 px on mobile.
- [ ] Infinite scroll shows a visible loading indicator while fetching more pages.
