---
name: ESLint catch block pattern
description: caughtErrors rule requires catch variable to be used or omitted — use bare catch {} not catch (_e) {}
type: feedback
---

The ESLint config sets `caughtErrors: 'all'` without a `caughtErrorsIgnorePattern`. This means you cannot use `catch (_err)` to suppress the unused-variable error. Instead, use the bare catch syntax:

```typescript
try {
    // ...
} catch {
    // error handling without accessing the error variable
}
```

**Why:** `varsIgnorePattern: '^_'` only applies to regular variables, not caught errors. The project's ESLint config does not set `caughtErrorsIgnorePattern`.

**How to apply:** Whenever writing a catch block where the error object isn't used, always write `catch {` with no variable binding.
