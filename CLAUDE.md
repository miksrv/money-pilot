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

- **`api/`** — RTK Query API definitions. Single `api` slice with all endpoints; tags `'Category'`, `'Transaction'`, `'Account'`, `'Payee'`, `'Recurring'`, `'User'`, `'Dashboard'` for cache invalidation.
- **`screens/`** — Page-level components (Dashboard, Transactions, Categories, Accounts, Recurring, Payees, Reports, Settings, Login, Register).
- **`components/`** — Shared UI components (AppBar, AppLayout, CurrencyInput, EmojiPicker, ColorPicker, CategorySelectField, AccountSelectField).
- **`store/`** — Redux store with `authSlice` (JWT token + `isAuth` flag, persisted to localStorage).
- **`utils/`** — Date helpers (dayjs), money formatting, localStorage helpers.
- **`styles/`** — SASS globals + dark/light CSS theme files. Theme toggled via `data-theme` attribute.
- **`tools/`** — i18next configuration (browser language detection + HTTP backend).

**Auth flow:** `AuthWrapper` wraps protected routes, calls `useMeQuery` to validate the JWT, redirects unauthenticated users to `/login`. JWT is stored in localStorage and sent as `Authorization: Bearer <token>`.

**API proxy:** Vite proxies `/api/*` → `http://localhost:8080/` (strips `/api` prefix), so frontend calls go to the PHP backend during dev.

### Backend (`server/app/`)

RESTful CodeIgniter 4 API. Routes: `/auth`, `/register`, `/accounts`, `/transactions`, `/categories`, `/payees`, `/groups`, `/users`, `/dashboard`, `/recurring`, `/reports`.

- **`Controllers/`** — One controller per resource. Auth via JWT (`firebase/php-jwt`), sessions tracked in `sessions` DB table.
- **`Models/`** — CI4 models for `users`, `accounts`, `transactions`, `categories`, `payees`, `groups`, `group_members`, `group_invitations`, `sessions`, `recurring_transactions`.
- **`Filters/CorsFilter`** — Handles CORS preflight; OPTIONS routes are registered for every endpoint.
- **`Libraries/`** — JWT auth library.

Database: MariaDB 10.5.8 at `127.0.0.1:3310` (Docker). Credentials and JWT secret are in `server/.env`.

## Code Style

- **Prettier:** 4-space indent, single quotes, no trailing commas, 120 char line width, single JSX attribute per line.
- **ESLint:** Strict — no `console.log` (warn/error only), no `any`, max component nesting enforced, imports sorted via `simple-import-sort`.
- **TypeScript:** Strict mode, path alias `@/*` → `src/*`.
- **UI Kit:** `simple-react-ui-kit` is the component library — prefer its components over custom HTML.
