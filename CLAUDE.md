# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Money Pilot** is a personal finance management web app (PWA) — monorepo with a React/TypeScript frontend (`client/`) and a CodeIgniter 4 PHP backend (`server/`).

## Commands

### Frontend (`client/`)

```bash
yarn dev              # Start Vite dev server on port 3000
yarn build            # TypeScript check + production build
yarn eslint:check     # Run ESLint
yarn eslint:fix       # Auto-fix ESLint issues
yarn prettier:check   # Check formatting
yarn prettier:fix     # Apply Prettier formatting
yarn locales:build    # Rebuild i18next translation files
```

### Backend (`server/`)

```bash
php spark serve               # Start dev server on port 8080
php spark migrate             # Run pending migrations
php spark migrate:rollback    # Rollback last migration
php spark db:seed ManageSeeder
php spark routes              # List all routes
composer test                 # Run PHPUnit tests
```

### Database

```bash
# From config/ directory
docker-compose up -d          # Start MariaDB on port 3310
```

## Architecture

### Frontend (`client/src/`)

- **`api/`** — RTK Query API definitions. Single `api` slice with all endpoints; cache-invalidation tags: `'Category'`, `'Transaction'`, `'Account'`, `'Payee'`, `'Recurring'`, `'User'`, `'Dashboard'`, `'Group'`.
- **`screens/`** — Page-level components: Dashboard, Transactions, Categories, Accounts, Recurring, Payees, Reports, Settings, Login, Register.
- **`components/`** — Shared UI components. See component inventory below.
- **`store/`** — Redux store with `authSlice` (JWT token + `isAuth` flag + `activeGroupId`, all persisted to localStorage).
- **`utils/`** — Shared utilities: `dates.ts` (dayjs helpers), `money.ts` (formatMoney), `localStorage.ts` (typed wrapper), `echart.ts` (theme config + CHART_COLORS).
- **`styles/`** — SASS globals + `light.css` / `dark.css` CSS variable files. Theme toggled via `data-theme` attribute on `<html>`.
- **`tools/`** — i18next configuration (browser language detection + HTTP backend).

### Component Inventory (`client/src/components/`)

| Directory | Primary Component | What it does |
|-----------|------------------|--------------|
| `account-select-field/` | `AccountSelectField` | Dropdown for selecting an account in forms; auto-select first |
| `app-bar/` | `AppBar` | Top bar with hamburger, group switcher, logout |
| `app-layout/` | `AppLayout` | Master layout: collapsible sidebar + top bar + content area; `Menu` is a separate file in this dir |
| `categories-table/` | `CategoriesTable` | Tree-view table with expand/collapse parent groups, budget progress bars; `CategoryFormDialog` and `CategoryPicker` are separate files here |
| `category-select-field/` | `CategorySelectField` | Dropdown for selecting a category (filters out `is_parent` categories) |
| `color-picker/` | `ColorPicker` | 17-color palette popout; exports `getColorHex(colorName)` from `utils.ts` |
| `currency-input/` | `CurrencyInput` | Formatted monetary input with locale-aware display |
| `emoji-picker/` | `EmojiPicker` | Full emoji picker with category tabs, search, and recents |
| `income-vs-expense-chart/` | `IncomeVsExpenseChart` | ECharts grouped bar chart (last 6 months) |
| `monthly-spending-chart/` | `MonthlySpendingChart` | ECharts line chart: current month vs previous month daily cumulative spending |
| `recurring-table/` | `RecurringTable` | Table for recurring transactions with status badges and quick actions |
| `spending-by-category-chart/` | `SpendingByCategoryChart` | ECharts doughnut with legend showing emoji, name, amount, progress bar |
| `summary-card/` | `SummaryCard` | Metric card with title, value, and % change vs previous period |
| `transaction-table/` | `TransactionTable` | Date-grouped transaction list with multi-select, inline category picker, delete; `TransactionFormDialog` and `CategoryPicker` are separate files here |

### Key Frontend Patterns

**Auth flow:** `AuthWrapper` (in `App.tsx`) wraps all protected routes, calls `useMeQuery` to validate the JWT, redirects unauthenticated users to `/login`. JWT stored in localStorage under key `'auth'` and sent as `Authorization: Bearer <token>`.

**Email persistence:** After successful login, the user's email is saved to localStorage under `'auth_email'`. The login form reads this key on mount and pre-populates the email field.

**API proxy:** Vite proxies `/api/*` → `http://localhost:8080/` during dev.

**Parent categories:** Categories can be marked `is_parent: true` to act as grouping containers. Parent categories are excluded from the transaction form `CategorySelectField`. When a parent's color changes, it propagates automatically to all children (server-side). When a child's color changes, it propagates to the parent and all siblings.

**Categories tree view:** `CategoriesTable` accepts a `defaultExpanded?: boolean` prop (default `true`). It builds client-side groups from the flat `categories` array using `is_parent` and `parent_id` fields.

### Backend (`server/app/`)

RESTful CodeIgniter 4 API. Routes: `/auth`, `/register`, `/accounts`, `/transactions`, `/categories`, `/payees`, `/groups`, `/users`, `/dashboard`, `/recurring`, `/reports`.

- **`Controllers/`** — One controller per resource. Auth via JWT (`firebase/php-jwt`), sessions tracked in `sessions` DB table.
- **`Models/`** — CI4 models for `users`, `accounts`, `transactions`, `categories`, `payees`, `groups`, `group_members`, `group_invitations`, `sessions`, `recurring_transactions`.
- **`Filters/CorsFilter`** — Handles CORS preflight; OPTIONS routes registered for every endpoint.
- **`Libraries/`** — JWT auth library.

Database: MariaDB 10.5.8 at `127.0.0.1:3310` (Docker). Credentials and JWT secret are in `server/.env`.

### Categories Table Schema (key columns)

| Column | Type | Notes |
|--------|------|-------|
| `id` | VARCHAR(15) | Auto-generated |
| `user_id` | VARCHAR(15) | FK → users |
| `parent_id` | VARCHAR(15) nullable | FK → categories (self-ref) |
| `is_parent` | TINYINT(1) | 1 = grouping parent; never selectable in transactions |
| `name` | VARCHAR(50) | Unique per user |
| `type` | ENUM('income','expense') | |
| `icon` | VARCHAR(50) nullable | Emoji |
| `color` | VARCHAR(50) nullable | Color name (see ColorPicker palette) |
| `budget` | DECIMAL(15,2) nullable | Monthly budget; NULL for parent categories |
| `archived` | TINYINT(1) | Soft-hide from dropdowns |

## Code Style

- **Prettier:** 4-space indent, single quotes, no trailing commas, 120 char line width, single JSX attribute per line.
- **ESLint:** Strict — `console.log` banned (`console.warn`/`console.error` allowed), no `any`, max component nesting enforced, imports sorted via `simple-import-sort`.
- **TypeScript:** Strict mode, path alias `@/*` → `src/*`.
- **UI Kit:** `simple-react-ui-kit` is the mandatory component library. Never use raw `<input>`, `<select>`, or `<button>` elements where a kit component exists.

## Frontend Architecture Rules (mandatory)

1. **One file, one component.** Each `.tsx` file exports exactly one React component. If a secondary component is needed, extract it to its own file in the same directory. If it's reusable across directories, move it to `components/`.

2. **Constants → `constants.ts`.** All module-level constants (arrays, objects, magic numbers, default form values, enums) go in a local `constants.ts` file within the same directory. If the constant is used across multiple directories, place it in `client/src/utils/`.

3. **Utilities → `utils.ts`.** Pure helper functions (no React hooks, no JSX) go in a local `utils.ts` file. Cross-directory utilities belong in `client/src/utils/`.

4. **Hooks → `hooks.ts` or `use<Name>.ts`.** Custom hooks extracted from components go in a dedicated file. Cross-directory hooks belong in `client/src/hooks/` (create if needed).

5. **Error feedback is mandatory.** Every mutation must surface errors to the user via `<Message type='error'>` or equivalent — never silently `console.error`.
