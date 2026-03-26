# Money Pilot — Development Roadmap

> Personal finance management PWA inspired by [Copilot Money](https://www.copilot.money/).
> Monorepo: React/TypeScript frontend (`client/`) + CodeIgniter 4 PHP backend (`server/`).
> UI must be fully responsive — seamless on mobile and desktop. All UI components **must** use the `simple-react-ui-kit` library.

---

## Current State (as of March 2026)

**Done:**
- JWT authentication (login, register, token refresh, sessions)
- Accounts — list, add, edit (backend CRUD complete)
- Transactions — list, add, edit (backend CRUD complete)
- Categories — list, add, edit with monthly budget tracking
- Payees — backend CRUD + auto-create on transaction save
- Groups — backend CRUD with role-based access and invite tokens
- i18n infrastructure (i18next, browser language detection)
- PWA shell (vite-plugin-pwa)
- Dark/light theme via CSS variables

**Stubs (UI shell exists, no content):**
- Dashboard screen
- Recurring transactions screen
- Settings screen

**Gaps:**
- No delete operations exposed in the frontend
- No payee frontend UI
- No group/sharing frontend UI
- No recurring transactions backend (model/controller missing)
- Dashboard has no charts or summary data
- No CSV import/export

---

## Roadmap

### Phase 1 — MVP Core (Priority: High)

These features complete the essential personal finance loop. They must ship before any other work.

| # | Feature | Frontend | Backend | Spec |
|---|---------|----------|---------|------|
| 1.1 | [Dashboard](#) | Build summary cards, spending charts, account balances | Add `/dashboard/summary` endpoint | [features/01-dashboard.md](features/01-dashboard.md) |
| 1.2 | [Transactions — Complete CRUD](#) | Add delete, search, filter, pagination | Expose delete endpoint, add filter/search params | [features/02-transactions.md](features/02-transactions.md) |
| 1.3 | [Accounts — Complete CRUD](#) | Add delete, edit dialog, balance display | Expose delete endpoint | [features/03-accounts.md](features/03-accounts.md) |
| 1.4 | [Categories — Complete CRUD](#) | Add delete, archive | Expose delete endpoint | [features/04-categories.md](features/04-categories.md) |
| 1.5 | [Settings & Profile](#) | Build settings screen: profile, theme toggle, language | Add profile update endpoint | [features/05-settings.md](features/05-settings.md) |

---

### Phase 2 — Advanced Finance Features (Priority: Medium)

| # | Feature | Frontend | Backend | Spec |
|---|---------|----------|---------|------|
| 2.1 | [Recurring Transactions](#) | Full CRUD screen, upcoming list | Create model, migration, and controller | [features/06-recurring-transactions.md](features/06-recurring-transactions.md) |
| 2.2 | [Payees Management](#) | Payees list, edit, merge, delete | Expose merge endpoint | [features/07-payees.md](features/07-payees.md) |
| 2.3 | [Reports & Analytics](#) | Spending trends, income vs. expense chart, category breakdown | Add `/reports` endpoints for aggregated data | [features/08-reports-analytics.md](features/08-reports-analytics.md) |

---

### Phase 3 — Collaboration (Priority: Low / Post-MVP)

| # | Feature | Frontend | Backend | Spec |
|---|---------|----------|---------|------|
| 3.1 | [Groups & Shared Accounts](#) | Invite flow, member management, shared views | Backend already complete — wire up frontend | [features/09-groups-sharing.md](features/09-groups-sharing.md) |

---

### Phase 4 — Platform Expansion (Future)

| # | Feature | Notes | Spec |
|---|---------|-------|------|
| 4.1 | [Telegram Mini App](#) | Separate app entry point using the existing REST API; keep in mind when designing API responses | [features/10-telegram-mini-app.md](features/10-telegram-mini-app.md) |

---

## Design Principles

1. **Mobile-first, desktop-enhanced.** Every screen must work on 320 px viewports and scale gracefully to wide desktop layouts.
2. **UI Kit only.** All interactive elements use `simple-react-ui-kit` components (`Button`, `Input`, `Select`, `Dialog`, `Table`, `Container`, `DatePicker`, etc.). Custom HTML is allowed only for layout scaffolding where no kit component applies.
3. **RTK Query for all API calls.** Cache tags: `'Category'`, `'Transaction'`, `'Account'`, `'Payee'`, `'Recurring'`, `'User'`.
4. **React Hook Form for all forms.** No uncontrolled inputs.
5. **i18n from day one.** All user-facing strings go through `i18next`. No hard-coded English labels in JSX.
6. **Strict TypeScript.** No `any`. All API response shapes are typed.
7. **Telegram-compatible API design.** Keep API responses lean and RESTful so the future Telegram Mini App can consume them without a separate backend.

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
