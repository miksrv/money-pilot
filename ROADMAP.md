# Monetka — Development Roadmap

> Personal finance management PWA inspired by [Copilot Money](https://www.copilot.money/).
> Monorepo: React/TypeScript frontend (`client/`) + CodeIgniter 4 PHP backend (`server/`).
> UI must be fully responsive — seamless on mobile and desktop. All UI components **must** use the `simple-react-ui-kit` library.

---

## Current State (as of March 2026)

**Done — Phases 1, 2 & 3 complete:**

**Core infrastructure**
- JWT authentication (login, register, token refresh, sessions)
- i18n via i18next (EN + RU)
- PWA shell via vite-plugin-pwa
- Dark / light / system theme via CSS variables
- Shared Budget — invite by email, explicit consent, `/join/:token`, AppBar budget switcher, viewer-role enforcement, full owner management

**Screens**
- **Dashboard** — summary cards (net worth, income, expenses, savings rate), monthly spending chart vs previous month, spending-by-category doughnut, income vs expense bar chart, recent transactions list (top 10)
- **Transactions** — full CRUD, infinite-scroll paginated list with search + URL-synced filters, bulk delete, inline category switching, read-only viewer-role enforcement
- **Categories** — full CRUD with soft archive/unarchive, delete guard; parent/group categories with expand/collapse tree view, color propagation (parent→children and child→parent+siblings), emoji picker with search + recents, color picker
- **Accounts** — full CRUD with delete guard (blocked if has transactions), card grid UI
- **Recurring Transactions** — full CRUD, generate-now, toggle active/paused, backend model + migration + controller
- **Payees** — list, search, edit, merge, delete with usage guard
- **Reports & Analytics** — spending by category, income vs expense, spending trend, net worth history, top payees; date-range presets + custom range; CSV export per section
- **Settings** — profile form, password change (invalidates all sessions), theme/language prefs, account deletion, shared budget management (members, pending invitations, revoke, delete)
- **Login** — redesigned split-panel layout (brand panel + form card), email pre-fill from localStorage, password show/hide toggle, root API error surfacing, `/register` navigation link
- **Register** — matching split-panel layout, password show/hide toggle, error surfacing, `/login` navigation link

**Code quality (March 2026)**
- One-file-one-component rule enforced across the entire frontend
- Constants extracted to `constants.ts` per directory
- Utility functions extracted to `utils.ts` per directory
- All silent `console.error` error handlers replaced with user-visible `<Message>` components

**Gaps / Known Issues:**
- No CSV import
- No first-time user onboarding flow
- No budget alert notifications
- Several accessibility gaps (color-only indicators, keyboard navigation, ARIA labels)
- Mobile responsiveness issues on Transactions filter bar and table views

---

## Roadmap

### Phase 4 — Platform Expansion

| # | Feature | Notes | Spec |
|---|---------|-------|------|
| 4.1 | Telegram Mini App | Separate entry point using the existing REST API | [features/10-telegram-mini-app.md](features/10-telegram-mini-app.md) |

---

### Phase 5 — UX Polish & Accessibility

| # | Feature | Notes | Spec |
|---|---------|-------|------|
| 5.1 | Global Accessibility Pass | ARIA labels, keyboard navigation, color-independent indicators, skip links | [features/11-ux-accessibility.md](features/11-ux-accessibility.md) |
| 5.2 | Onboarding Flow | Guided setup for new users: add first account → category → transaction | [features/12-onboarding.md](features/12-onboarding.md) |
| 5.3 | CSV Import | Upload bank statement CSV; map columns to transaction fields; dedup | [features/13-csv-import.md](features/13-csv-import.md) |
| 5.4 | Transaction Enhancements | Notes field, undo delete (5 s toast), bulk category assignment, duplicate detection | [features/16-transaction-enhancements.md](features/16-transaction-enhancements.md) |
| 5.5 | Smart Categorization | Default category per payee; auto-apply on new transaction | [features/14-smart-categorization.md](features/14-smart-categorization.md) |

---

### Phase 6 — Power Features

| # | Feature | Notes | Spec |
|---|---------|-------|------|
| 6.1 | Budget Alerts & Notifications | In-app banner when category reaches 80 % / 100 % of budget; dashboard warning badges | [features/15-budget-alerts.md](features/15-budget-alerts.md) |
| 6.2 | Advanced Reports | Budget vs actual overlay, spending forecasts, anomaly detection, drill-down from charts | [features/17-advanced-reports.md](features/17-advanced-reports.md) |
| 6.3 | Command Palette & Quick Search | Cmd+K global search across transactions, categories, payees, accounts | [features/18-quick-actions.md](features/18-quick-actions.md) |
| 6.4 | Account Enhancements | Balance trend indicator, account archiving, low-balance alerts | [features/03-accounts.md](features/03-accounts.md) |
| 6.5 | Recurring Calendar | Visual calendar of upcoming recurring transactions; skip / reschedule UI | [features/06-recurring-transactions.md](features/06-recurring-transactions.md) |
| 6.6 | Category Merging | Merge duplicate categories and bulk-reassign their transactions | [features/04-categories.md](features/04-categories.md) |

---

## Design Principles

1. **Mobile-first, desktop-enhanced.** Every screen must work on 320 px viewports and scale gracefully to wide desktop layouts.
2. **UI Kit only.** All interactive elements use `simple-react-ui-kit` components. Custom HTML is allowed only for layout scaffolding where no kit component applies.
3. **RTK Query for all API calls.** Cache tags: `'Category'`, `'Transaction'`, `'Account'`, `'Payee'`, `'Recurring'`, `'User'`, `'Dashboard'`, `'Group'`.
4. **React Hook Form for all forms.** No uncontrolled inputs.
5. **i18n from day one.** All user-facing strings go through `i18next`. No hard-coded labels in JSX.
6. **Strict TypeScript.** No `any`. All API response shapes are typed.
7. **One file, one component.** Each `.tsx` file exports exactly one React component. Secondary components are extracted to their own file in the same directory.
8. **Extract non-rendering code.** Module-level constants → `constants.ts`. Pure utility functions → `utils.ts`. Custom hooks → `hooks.ts` or `use<Name>.ts`. All scoped to their directory unless used cross-directory.
9. **Telegram-compatible API design.** Keep API responses lean and RESTful.

---

## Tech Stack Reference

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5 (strict), Vite 7, Redux Toolkit + RTK Query |
| UI Kit | `simple-react-ui-kit` 1.7.x |
| Forms | React Hook Form 7 |
| Charts | ECharts 6 via `echarts-for-react` |
| i18n | i18next 25 with browser language detection |
| Dates | dayjs |
| Backend | CodeIgniter 4 (PHP 8.x) |
| Auth | firebase/php-jwt 6 (Bearer token) |
| Database | MariaDB 10.5 (Docker on port 3310) |
| PWA | vite-plugin-pwa |
