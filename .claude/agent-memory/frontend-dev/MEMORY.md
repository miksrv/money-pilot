# Frontend Dev Memory Index

- [Table formatter row type](table-formatter-row-type.md) — `formatter` in `simple-react-ui-kit` Table receives `(value, rows: T[], index)` — use `rows[index]` for the current row
- [simple-react-ui-kit exports](ui-kit-exports.md) — Full export list and key prop interfaces for Container, Progress, Message, Skeleton
- [RTK Query api.ts patterns](rtk-query-patterns.md) — tagTypes, endpoint structure, encodeQueryData usage, and export conventions
- [ESLint catch block pattern](eslint-catch-errors.md) — use bare `catch {` not `catch (_err)` — caughtErrorsIgnorePattern is not set
- [Template literal type restriction](eslint-template-literals.md) — use string concatenation with `?? ''` for optional fields in i18n keys, not template literals
