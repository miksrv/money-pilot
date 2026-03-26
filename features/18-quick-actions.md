# Feature 18 — Command Palette & Quick Actions

## Goal

Add a global command palette (Cmd+K / Ctrl+K) that lets power users navigate the app, search transactions, and trigger common actions without reaching for the mouse. This is a significant UX upgrade for desktop users.

---

## Scope

### Command palette (Cmd+K)

A modal overlay with a search input. Supports:

| Command type | Examples |
|---|---|
| Navigation | "Go to Dashboard", "Go to Reports", "Go to Settings" |
| Transaction search | Type any keyword → shows matching transactions inline |
| Quick action | "Add transaction", "Add account", "Add category" |
| Category jump | "Go to Food category", "Go to Rent" |

Keyboard navigation: `↑` / `↓` to move between results, `Enter` to select, `Escape` to close.

### App bar quick-add button

A `+` icon button in `AppBar` (right side, before logout) that opens `TransactionFormDialog` directly — for users who primarily use the app on mobile and don't use keyboard shortcuts.

---

## Frontend Tasks

### New component: `client/src/components/command-palette/CommandPalette.tsx`

State:
```typescript
const [query, setQuery] = useState('')
const [selectedIndex, setSelectedIndex] = useState(0)
```

Data sources (all from existing RTK Query cache, no new API calls):
- Static navigation items (hard-coded routes)
- `useListCategoriesQuery()` — for category jump commands
- `useListTransactionsQuery({ search: query })` — live transaction search when query ≥ 2 chars

Result groups:
1. Actions (always shown at top: "Add transaction", "Add account", "Add category")
2. Navigation (filtered by query match)
3. Transactions (shown when query ≥ 2 chars)
4. Categories (filtered by query match)

Rendering: each result is a `<button>` with icon, primary text, and secondary text (e.g., amount/date for transactions).

### New hook: `client/src/components/command-palette/useCommandPalette.ts`

```typescript
export const useCommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen((prev) => !prev)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    return { isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }
}
```

### Modified: `client/src/App.tsx`

- Import `CommandPalette` and `useCommandPalette`.
- Render `<CommandPalette>` at the root level (outside all routes, inside `Provider`).
- Pass `isOpen`, `onClose` props.

### Modified: `client/src/components/app-bar/AppBar.tsx`

- Add a `+` `Button` (mode: `secondary`, icon: `PlusCircle`) before the logout button.
- On click: open `TransactionFormDialog`.
- On narrow mobile (< 480 px): show only the icon, no label.

---

## Styles

```sass
.overlay
    position: fixed
    inset: 0
    background: var(--overlay-background)
    z-index: 1000
    display: flex
    align-items: flex-start
    justify-content: center
    padding-top: 15vh

.palette
    width: 100%
    max-width: 560px
    background: var(--container-background-color)
    border-radius: 12px
    box-shadow: var(--popout-shadow)
    overflow: hidden

.searchInput
    width: 100%
    padding: 16px 20px
    font-size: 16px
    border: none
    border-bottom: 1px solid var(--input-border-color)
    background: transparent
    color: var(--text-color-primary)
    outline: none

.results
    max-height: 400px
    overflow-y: auto

.group
    padding: 8px 0 4px
    font-size: 11px
    font-weight: 600
    text-transform: uppercase
    color: var(--text-color-secondary)
    padding-left: 16px

.result
    display: flex
    align-items: center
    gap: 12px
    padding: 10px 16px
    cursor: pointer
    font-size: 14px

    &:hover, &.selected
        background: var(--dropdown-background-color-hover)

.resultIcon
    font-size: 18px
    width: 24px
    text-align: center
    flex-shrink: 0

.resultPrimary
    flex: 1
    color: var(--text-color-primary)

.resultSecondary
    font-size: 12px
    color: var(--text-color-secondary)

.empty
    padding: 24px 16px
    text-align: center
    color: var(--text-color-secondary)
    font-size: 14px

.hint
    padding: 8px 16px
    font-size: 12px
    color: var(--text-color-secondary)
    border-top: 1px solid var(--input-border-color)
    display: flex
    gap: 16px

.kbd
    background: var(--input-background-color)
    border-radius: 4px
    padding: 2px 6px
    font-size: 11px
    font-family: monospace
```

---

## i18n Keys

```
commandPalette.placeholder
commandPalette.noResults
commandPalette.groupActions
commandPalette.groupNavigation
commandPalette.groupTransactions
commandPalette.groupCategories
commandPalette.actionAddTransaction
commandPalette.actionAddAccount
commandPalette.actionAddCategory
commandPalette.hint
```

---

## Acceptance Criteria

- [ ] Pressing Cmd+K (Mac) or Ctrl+K (Windows/Linux) opens the palette from any screen.
- [ ] Pressing Escape closes the palette.
- [ ] Arrow keys navigate between results; Enter activates the selected result.
- [ ] Navigation commands route to the correct screen.
- [ ] Quick actions open the correct form dialog.
- [ ] Transaction search returns results within 300ms (debounced).
- [ ] Category search filters correctly by name.
- [ ] Palette is accessible (focus trapped, screen reader announces results with `aria-live`).
- [ ] Quick-add `+` button in AppBar opens TransactionFormDialog.
- [ ] All strings translated.
- [ ] On mobile (no keyboard), palette is still accessible via the `+` button in AppBar.
