---
name: simple-react-ui-kit exports
description: Full export list and key prop interfaces for the simple-react-ui-kit component library
type: reference
---

## Full export list (as of latest version in this project)

Badge, Button, Calendar, Checkbox, Container, DatePicker, Dialog, Icon, Input, Message, Popout, Progress, Select, Skeleton, Spinner, Table, cn

## Key prop interfaces

**Container**: `title?`, `action?` (ReactNode in header), `header?`, `footer?`, `children?`, `className?`

**Progress**: `value?` (0-100), `height?`, `color?: 'main' | 'red' | 'orange' | 'green'`, `className?`

**Message**: `type?: 'error' | 'warning' | 'success' | 'info'`, `title?`, `children?`

**Skeleton**: standard HTMLDivElement props — use `style={{ height, width }}` for sizing

**Table<T>**: `data?`, `columns?` (Array of ColumnProps<T>), `loading?`, `noDataCaption?`, `height?`, `maxHeight?`, `stickyHeader?`
- ColumnProps: `header`, `accessor: keyof T`, `formatter?: (value, rows: T[], index) => ReactNode`, `background?`, `isSortable?`, `hidden?`

**Badge**: `label?`, `size?: 'small' | ...`, `icon?` (ReactNode), `style?`

**Button**: `mode?: 'primary' | 'secondary' | 'link'`, `label?`, `icon?`, `link?` (renders as anchor), `onClick?`
