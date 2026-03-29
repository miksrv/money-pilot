# Feature 10 — Telegram Mini App

## Goal

Build a Telegram Mini App (TMA) that gives users access to their Monetka account directly inside Telegram. The TMA provides a mobile-optimized view for checking balances, recent transactions, and quickly adding new transactions — all backed by the same REST API as the web app.

> **Status: Future / Phase 4.** No implementation work starts until all Phase 1–3 features are complete. This document defines the design constraints so API decisions made today remain compatible.

---

## What is a Telegram Mini App?

A Telegram Mini App is a web application (HTML/CSS/JS) loaded inside the Telegram client via a `WebApp` object. It can:
- Use Telegram's native UI elements (main button, back button, header color).
- Authenticate users via the `initData` payload provided by Telegram (cryptographically signed).
- Use the device camera, haptics, biometrics, and QR scanner.
- Share content back to Telegram chats.

Reference: [Telegram Mini Apps documentation](https://core.telegram.org/bots/webapps)

---

## Architecture Decisions (API constraints to respect NOW)

These requirements must be considered when building the REST API in Phases 1–3:

1. **No session cookies.** All auth is via `Authorization: Bearer <token>` — already the case. Good.
2. **Telegram auth endpoint.** A new `POST /auth/telegram` endpoint will be needed:
   - Accepts `initData` string from `window.Telegram.WebApp.initData`.
   - Validates the HMAC signature using the bot token.
   - Returns a JWT (same format as regular login).
   - Links the Telegram `user_id` to an existing Monetka account by email or auto-creates one.
3. **Lean responses.** Keep response payloads small — TMA users are on mobile networks. Avoid embedding large nested objects; use IDs and let the client fetch details on demand.
4. **Pagination everywhere.** All list endpoints must support `limit` + `page`. TMA will use small pages (10–15 items).
5. **Quick-add transaction.** The TMA's primary action is adding a transaction in as few taps as possible. The `POST /transactions` endpoint must remain lightweight — only `amount`, `type`, `account_id`, and optionally `category_id` should be required.

---

## TMA Scope (when implemented)

### Screens

| Screen | Description |
|--------|-------------|
| Home | Net worth, account balances as a horizontal scroll list, last 5 transactions |
| Transactions | Paginated list with search; swipe-to-delete on mobile |
| Add Transaction | Bottom-sheet form: amount, type, category, account, date, notes |
| Accounts | Balance cards, read-only in MVP |
| Settings | Theme toggle, logout |

### Authentication Flow

1. User opens the Mini App from the Telegram bot (via `/start` or inline keyboard button).
2. TMA calls `window.Telegram.WebApp.initData` → sends to `POST /auth/telegram`.
3. Backend validates HMAC → returns JWT.
4. JWT stored in `localStorage` (within the WebApp context) and used for all subsequent requests.
5. If the Telegram account is not yet linked to a Monetka account: show a one-time link/register flow.

### Tech Stack (TMA)

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (same codebase, separate Vite entry point) |
| UI | `simple-react-ui-kit` (same kit) + Telegram UI feel |
| State | Redux Toolkit + RTK Query (reuse the existing `api` slice) |
| Auth | Telegram `initData` → JWT |
| TMA SDK | `@tma.js/sdk` or direct `window.Telegram.WebApp` access |

### Monorepo strategy

The TMA can be a **second Vite entry point** in the same `client/` directory:
- `client/src/tma/` — TMA-specific screens and entry point (`main-tma.tsx`)
- Shares `client/src/api/`, `client/src/store/`, `client/src/utils/` with the main app
- Separate build output: `dist/tma/`

Or a **separate package** in the monorepo: `tma/` at the root level — simpler isolation, cleaner dependency management.

Decision to be made when Phase 4 begins.

---

## Backend Tasks (to prepare NOW — minimal)

### `telegram_id` column on users table

Add migration:
```sql
ALTER TABLE `users` ADD COLUMN `telegram_id` BIGINT NULL UNIQUE AFTER `phone`;
```

This allows linking a Monetka account to a Telegram user ID.

### `POST /auth/telegram` endpoint (implement in Phase 4)

Validate `initData` as per Telegram's HMAC verification algorithm:
```
data_check_string = sorted(key=value pairs from initData, excluding hash) joined by \n
secret_key = HMAC-SHA256(bot_token, "WebAppData")
expected_hash = HMAC-SHA256(data_check_string, secret_key)
```

---

## Acceptance Criteria (Phase 4)

- [ ] User can open the Mini App from Telegram and authenticate without a separate login.
- [ ] Home screen shows net worth and recent transactions.
- [ ] Add transaction completes in 3 taps or fewer (amount → category → confirm).
- [ ] Transactions list is paginated with pull-to-refresh.
- [ ] Telegram Main Button is used as the primary action (e.g., "Save Transaction").
- [ ] Theme adapts to Telegram's color scheme variables.
- [ ] Works on both iOS and Android Telegram clients.
- [ ] All strings translated (shares the same i18n resources as the web app).
