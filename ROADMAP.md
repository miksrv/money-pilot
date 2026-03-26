# Money Pilot — Development Roadmap

> Personal finance management PWA inspired by [Copilot Money](https://www.copilot.money/).
> Monorepo: React/TypeScript frontend (`client/`) + CodeIgniter 4 PHP backend (`server/`).
> UI must be fully responsive — seamless on mobile and desktop. All UI components **must** use the `simple-react-ui-kit` library.

---

## Current State (as of March 2026)

**Done — Phases 1, 2 & 3 complete:**
- JWT authentication (login, register, token refresh, sessions)
- Dashboard — summary cards (net worth, income, expenses, savings rate), ECharts doughnut + bar charts, recent transactions table
- Transactions — full CRUD, paginated/filtered list with search, URL-synced filters
- Accounts — full CRUD with delete guard (blocked if has transactions), card grid UI
- Categories — full CRUD with soft archive/unarchive, delete guard, budget progress bars
- Settings — profile form, password change (invalidates all sessions), theme/language prefs, account deletion
- Recurring Transactions — full CRUD screen, generate-now, toggle active/paused, backend model + migration + controller
- Payees — list, edit, merge, delete with usage guard; backend CRUD + merge endpoint
- Reports & Analytics — spending by category, income vs expense, spending trend, net worth history, top payees; CSV export per section
- Shared Budget — invite partner by email, explicit data-sharing consent, accept via `/join/:token` link, AppBar budget switcher, shared budget banner, viewer role enforcement, full owner management (members, pending invitations, revoke, delete)
- i18n via i18next (EN + RU)
- PWA shell via vite-plugin-pwa
- Dark/light theme via CSS variables

**Gaps:**
- No CSV import

---

## Roadmap

### Phase 4 — Platform Expansion (Future)

| # | Feature | Notes | Spec |
|---|---------|-------|------|
| 4.1 | [Telegram Mini App](#) | Separate app entry point using the existing REST API; keep in mind when designing API responses | [features/10-telegram-mini-app.md](features/10-telegram-mini-app.md) |

---

## Design Principles

1. **Mobile-first, desktop-enhanced.** Every screen must work on 320 px viewports and scale gracefully to wide desktop layouts.
2. **UI Kit only.** All interactive elements use `simple-react-ui-kit` components (`Button`, `Input`, `Select`, `Dialog`, `Table`, `Container`, `DatePicker`, etc.). Custom HTML is allowed only for layout scaffolding where no kit component applies.
3. **RTK Query for all API calls.** Cache tags: `'Category'`, `'Transaction'`, `'Account'`, `'Payee'`, `'Recurring'`, `'User'`, `'Dashboard'`.
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
