---
name: RTK Query api.ts patterns
description: Conventions for tagTypes, endpoint structure, encodeQueryData, and hook exports in api.ts
type: reference
---

## tagTypes

Currently: `['Category', 'Transaction', 'Account', 'Dashboard']`

## Endpoint conventions

- Queries use `providesTags`, mutations use `invalidatesTags`
- Tag format: `[{ id: 'LIST', type: 'Category' }]` or `[{ id: 'SUMMARY', type: 'Dashboard' }]`
- Optional query params: `query: (param) => \`/endpoint${encodeQueryData(param)}\``
- `encodeQueryData` handles `void | undefined | object` — safe to pass directly from RTK Query optional param

## Auth header

Token is set in `prepareHeaders` from `(getState() as RootState).auth.token`

## Import chain

`api.ts` → `./index` → `export * as ApiModel from './models'` + `export * as ApiType from './types'`

Adding a new model to `src/api/models/index.ts` makes it available as `ApiModel.NewType` in api.ts automatically.

## Hook export pattern

All hooks destructured from `api` at the bottom of api.ts and exported. Always add new hooks to this list.

## Skip pattern for auth

```typescript
const isAuth = useAppSelector((state) => state.auth)
useListXxxQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })
```
