---
name: Template literal type restriction
description: @typescript-eslint/restrict-template-expressions blocks optional/undefined types in template literals — use string concatenation or nullish coalescing
type: feedback
---

The project enforces `@typescript-eslint/restrict-template-expressions`. This means that using an optional type (e.g., `string | undefined`) directly inside a template literal will fail:

```typescript
// WRONG — fails if account.type is undefined
t(`accounts.type.${account.type}`, ...)

// RIGHT — use concatenation or nullish coalescing
t('accounts.type.' + (account.type ?? ''), ...)
```

**Why:** The rule is strict and treats `undefined` in template literals as a type error.

**How to apply:** Whenever building i18n keys or dynamic strings from optional model fields, use string concatenation with `?? ''` rather than template literals.
