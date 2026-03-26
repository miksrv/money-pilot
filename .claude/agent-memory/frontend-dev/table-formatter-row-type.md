---
name: Table formatter row type
description: The formatter function in simple-react-ui-kit Table receives the full dataset as the second arg, not a single row
type: reference
---

The `ColumnProps<T>.formatter` signature is:

```typescript
formatter?: (value: T[keyof T], row: T[], index: number) => React.ReactNode
```

The second parameter `row` is **the full data array** (`T[]`), not the current row. Use `row[index]` to access the specific row for the current cell.

Example pattern:
```tsx
formatter: (value, rows, index) => {
    const transaction = rows[index]
    return <span>{transaction.type}</span>
}
```

**Why:** This was discovered when TypeScript reported `Property 'type' does not exist on type 'Transaction[]'` when trying to access `row.type` directly.
