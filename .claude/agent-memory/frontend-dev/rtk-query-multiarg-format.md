---
name: RTK Query multi-argument hook formatting
description: Prettier format rule for RTK Query hooks that take two arguments — first arg inline, second arg object on new lines
type: feedback
---

When calling an RTK Query hook with two arguments (e.g., query params + options object), Prettier formats it as:

```ts
// Correct — first arg on same line as function call, options object broken across lines
const { data } = useListAccountQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
    refetchOnReconnect: true,
    skip: !isAuth
})

// Wrong — first arg on own indented line
const { data } = useListAccountQuery(
    activeGroupId ? { group_id: activeGroupId } : undefined,
    { refetchOnReconnect: true, skip: !isAuth }
)
```

**Why:** This is Prettier's standard formatting for function calls where the first argument fits on the first line but the second argument is an object that should be expanded. The ESLint Prettier plugin enforces this strictly.

**How to apply:** Any time you add a conditional first argument to an RTK Query hook, put it inline with the hook name and put the options object expanded on the following lines.
