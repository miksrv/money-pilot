---
name: Apostrophe strings in i18n fallbacks
description: How to handle i18n fallback strings that contain apostrophes — Prettier requires double quotes when the string itself contains a single quote
type: feedback
---

When an i18n fallback string contains an apostrophe (e.g., "Alice's Budget"), use double quotes for the string literal — Prettier's `avoidEscape` option allows this and actually *requires* it.

```ts
// Correct — double quotes to avoid escaping
t('groups.viewingBudget', "Viewing {{name}}'s Budget", { name })

// Wrong — Prettier will error on escaped single quote
t('groups.viewingBudget', 'Viewing {{name}}\'s Budget', { name })
```

**Why:** The project Prettier config uses `singleQuote: true` with `avoidEscape: true`. The `avoidEscape` option means strings containing a single quote should use double quotes rather than backslash escaping. ESLint's `quotes` rule is set to `warn` for this case (not `error`).

**How to apply:** Whenever a string literal in TS/TSX would require a backslash-escaped apostrophe with single quotes, use double quotes instead. This applies to both i18n fallback strings and regular string values.
