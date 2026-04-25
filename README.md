# Monetka

Personal finance management PWA inspired by [Copilot Money](https://www.copilot.money/).

Monorepo with a React/TypeScript frontend (`client/`) and a CodeIgniter 4 PHP backend (`server/`).

## Features

- **Dashboard** — net worth, income/expenses summary cards, monthly spending chart, spending-by-category doughnut, income vs expense bar chart, recent transactions
- **Transactions** — full CRUD, infinite-scroll list with search and URL-synced filters, bulk delete, inline category switching
- **Categories** — tree view with parent groups, emoji icons, color picker, soft archive/unarchive, color propagation across parent/children
- **Accounts** — full CRUD with delete guard
- **Recurring Transactions** — full CRUD, generate-now, toggle active/paused
- **Payees** — list, search, edit, merge, delete
- **Reports** — spending by category, income vs expense, spending trend, net worth history, top payees; date-range presets + custom range; CSV export
- **Shared Budgets** — invite members by email, viewer-role enforcement, full owner management
- **Settings** — profile, password change (invalidates all sessions), theme/language preferences, account deletion
- **i18n** — English and Russian
- **Themes** — light, dark, system (CSS variables)
- **PWA** — installable on mobile and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript 5, Vite 7, Redux Toolkit + RTK Query |
| UI Kit | `simple-react-ui-kit` |
| Forms | React Hook Form |
| Charts | ECharts via `echarts-for-react` |
| i18n | i18next with browser language detection |
| Dates | dayjs |
| Backend | CodeIgniter 4 (PHP 8.x) |
| Auth | JWT Bearer tokens (`firebase/php-jwt`) |
| Database | MariaDB 10.5 |
| PWA | vite-plugin-pwa |

## Getting Started

### Prerequisites

- Node.js + Yarn
- PHP 8.x + Composer
- Docker (for the database)

### Database

```bash
cd config
docker-compose up -d   # starts MariaDB on port 3310
```

### Backend

```bash
cd server
cp .env.example .env   # fill in DB credentials and JWT secret
composer install
php spark migrate
php spark serve        # runs on http://localhost:8080
```

### Frontend

```bash
cd client
yarn install
yarn dev               # runs on http://localhost:3000
```

The Vite dev server proxies `/api/*` to `http://localhost:8080`.

## Project Structure

```
monetka-web/
├── client/        # React/TypeScript frontend
│   └── src/
│       ├── api/           # RTK Query endpoint definitions
│       ├── components/    # Shared UI components
│       ├── screens/       # Page-level components
│       ├── store/         # Redux store (auth slice)
│       ├── styles/        # SASS globals + theme CSS variables
│       ├── tools/         # i18next configuration
│       └── utils/         # Shared utilities (dates, money, charts)
├── server/        # CodeIgniter 4 PHP backend
│   └── app/
│       ├── Controllers/   # One controller per resource
│       ├── Models/        # CI4 models
│       ├── Filters/       # CORS filter, auth filter
│       └── Libraries/     # JWT auth library
└── config/        # Docker Compose for MariaDB
```

## Available Commands

### Frontend (`client/`)

```bash
yarn dev              # Start Vite dev server
yarn build            # TypeScript check + production build
yarn eslint:check     # Run ESLint
yarn eslint:fix       # Auto-fix ESLint issues
yarn prettier:fix     # Apply Prettier formatting
yarn locales:build    # Rebuild i18next translation files
```

### Backend (`server/`)

```bash
php spark serve               # Start dev server
php spark migrate             # Run pending migrations
php spark migrate:rollback    # Rollback last migration
php spark db:seed ManageSeeder
php spark routes              # List all routes
composer test                 # Run PHPUnit tests
```

## License

See [LICENSE](LICENSE).
