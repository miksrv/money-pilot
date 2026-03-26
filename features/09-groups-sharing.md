# Feature 09 — Groups & Shared Accounts

## Goal

Wire up the frontend for the group/sharing system that is already fully implemented on the backend. Users can create groups, invite others, and view shared transactions within the group context.

**Backend status:** Complete (GroupController, GroupMemberModel, GroupInvitationModel).
**Frontend status:** No screens or API calls exist.

---

## Concept

A **Group** is a shared financial workspace:
- One owner, multiple members with roles (`owner`, `member`, `viewer`).
- Members can add/view transactions tied to the group.
- Viewers can only read.
- Invitations are sent by email-like tokens; invitees accept via a link.

---

## UI / UX Requirements

- Group management accessible from Settings or a sidebar entry.
- Group switcher in the AppBar: "Personal" (default) + any joined groups.
- When a group is active, the Transactions and Dashboard screens show group-scoped data.
- Invite flow via a shareable link or email input.
- Role badges: Owner (gold), Member (blue), Viewer (grey).
- All UI via `simple-react-ui-kit`.

---

## Frontend Tasks

### New files
- `client/src/screens/Groups/index.tsx` — group list + create
- `client/src/screens/Groups/GroupDetail/index.tsx` — members, invitations, settings
- `client/src/screens/Groups/Groups.module.sass`

### Modified files
- `client/src/components/AppBar/` — add group switcher dropdown (`Select` or `Popout`)
- `client/src/store/authSlice.ts` — add `activeGroupId: string | null` to persisted state
- `client/src/api/api.ts` — add all group endpoints
- `client/src/screens/Transactions/index.tsx` — pass `group_id` param to `listTransactions` when a group is active
- `client/src/screens/Dashboard/index.tsx` — pass `group_id` to summary endpoint when active

### Group Switcher (AppBar)
```tsx
<Select
    options={[
        { key: null, value: t('groups.personal') },
        ...groups.map(g => ({ key: g.id, value: g.name })),
    ]}
    value={activeGroupId}
    onSelect={(items) => dispatch(setActiveGroup(items?.[0]?.key ?? null))}
/>
```

### Groups Screen Layout

**My Groups list:**
- Each group card: name, member count, your role badge, "Manage" button.
- "Create Group" button at top.

**Create Group Dialog:**
- Name (`Input`, required).
- Description (`Input`, optional).

**Group Detail Page / Dialog:**

Tab 1 — Members:
- `Table`: avatar initials, name, email, role `Badge`, remove button (owner only).

Tab 2 — Invitations:
- Pending invitations list: email/token, expires at, "Copy link" / "Revoke" actions.
- "Invite Member" button → dialog with email input + role selector.

Tab 3 — Settings (owner only):
- Rename group.
- Transfer ownership.
- Delete group (with confirmation).

### Invitation Acceptance Flow
- Route `/groups/join/:token` — public page (no auth required initially).
- Call `POST /groups/join` with the token.
- If not logged in: redirect to `/login?redirect=/groups/join/${token}`.
- After login: auto-call the join endpoint.
- Success: show group name + "You've joined!" → redirect to Dashboard.

### New RTK Query endpoints
```typescript
listGroups: builder.query<Group[], void>({
    query: () => '/groups',
    providesTags: ['Group'],
})

createGroup: builder.mutation<Group, CreateGroupBody>({
    query: (body) => ({ url: '/groups', method: 'POST', body }),
    invalidatesTags: ['Group'],
})

updateGroup: builder.mutation<Group, { id: string; body: UpdateGroupBody }>({
    query: ({ id, body }) => ({ url: `/groups/${id}`, method: 'PUT', body }),
    invalidatesTags: ['Group'],
})

deleteGroup: builder.mutation<void, string>({
    query: (id) => ({ url: `/groups/${id}`, method: 'DELETE' }),
    invalidatesTags: ['Group'],
})

getGroupMembers: builder.query<GroupMember[], string>({
    query: (groupId) => `/groups/${groupId}/members`,
    providesTags: ['Group'],
})

inviteMember: builder.mutation<GroupInvitation, { groupId: string; body: InviteBody }>({
    query: ({ groupId, body }) => ({ url: `/groups/${groupId}/invite`, method: 'POST', body }),
    invalidatesTags: ['Group'],
})

removeMember: builder.mutation<void, { groupId: string; memberId: string }>({
    query: ({ groupId, memberId }) => ({ url: `/groups/${groupId}/members/${memberId}`, method: 'DELETE' }),
    invalidatesTags: ['Group'],
})

joinGroup: builder.mutation<Group, { token: string }>({
    query: (body) => ({ url: '/groups/join', method: 'POST', body }),
    invalidatesTags: ['Group'],
})
```

### Translations (i18n keys to add)
```
groups.title
groups.personal
groups.myGroups
groups.createGroup
groups.groupName
groups.description
groups.members
groups.invitations
groups.settings
groups.role.owner
groups.role.member
groups.role.viewer
groups.inviteMember
groups.inviteEmail
groups.inviteRole
groups.inviteLink
groups.copyLink
groups.revokeInvite
groups.removeMember
groups.transferOwnership
groups.deleteGroup
groups.deleteConfirmTitle
groups.deleteConfirmBody
groups.joinSuccess
groups.joinTitle
groups.pendingInvitations
groups.noGroups
groups.noMembers
groups.switchGroup
```

---

## Backend Tasks

The backend is already implemented. Verify and fix any gaps:

### Verify existing endpoints

| Method | Route | Notes |
|--------|-------|-------|
| GET | /groups | List user's groups (owned + member) |
| POST | /groups | Create group |
| GET | /groups/{id} | Get group details |
| PUT | /groups/{id} | Update name/description (owner only) |
| DELETE | /groups/{id} | Delete group (owner only) |
| GET | /groups/{id}/members | List members |
| POST | /groups/{id}/invite | Create invitation (returns token) |
| POST | /groups/join | Accept invitation by token |
| DELETE | /groups/{id}/members/{userId} | Remove member (owner only) |

### `group_id` scoping for transactions

Update `TransactionController::index()` to accept optional `group_id` param:
- If provided: return transactions for that group (check membership).
- If not: return personal transactions (current behavior).

Update `DashboardController::summary()` similarly.

### Invitation link format
`/groups/join/{token}` — token stored in `group_invitations.token` (already in the model).

---

## Acceptance Criteria

- [ ] User can create a group and see it in the group switcher.
- [ ] Switching to a group changes the Transactions and Dashboard data to group-scoped.
- [ ] Owner can invite members by generating a shareable link.
- [ ] Invitee can follow the link, log in, and join the group.
- [ ] Owner can remove members and revoke invitations.
- [ ] Viewer role cannot add transactions.
- [ ] Group can be deleted by the owner with confirmation.
- [ ] Personal context ("Personal") is always available as a fallback.
- [ ] All strings translated.
