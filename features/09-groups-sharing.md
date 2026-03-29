# Feature 09 — Shared Budget

## Product Concept

A **Shared Budget** lets a user grant another registered user full, transparent access to their entire financial picture — all accounts, all transactions, all history. It is not a separate workspace with its own transactions. It is a *view* of the owner's personal data, made accessible to a trusted partner (spouse, accountant, financial advisor).

**Mental model:** "I am sharing my budget with you. You will see everything — every account, every transaction, past and future."

This is backed by the existing `groups` / `group_members` / `group_invitations` database tables. The terminology in the UI is "Shared Budget", not "Group".

---

## Core Rules

1. **One owner, N partners.** The owner is the person whose data is being shared. They retain full control and can revoke access at any time.
2. **Roles:**
   - `owner` — the data belongs to them. Full control over the shared budget (invite, remove, delete).
   - `member` — full CRUD on the owner's accounts and transactions.
   - `viewer` — read-only access to the owner's data.
3. **Invite by email.** The inviting user types an email address. If that email is not registered → show a clear error. No numeric user IDs are ever surfaced.
4. **Explicit consent.** The invite dialog must display a prominent warning explaining that the invited user will see ALL accounts and ALL transactions, including historical data. The invitee also sees this summary before accepting.
5. **Context switching.** Once a user has accepted one or more shared budgets, an AppBar switcher appears. Switching context changes ALL data-fetching screens (Dashboard, Transactions, Accounts) to show the selected owner's data. A persistent banner identifies whose budget is being viewed.
6. **Viewer restrictions.** When in a shared budget context with `viewer` role, all add/edit/delete actions are hidden from the UI.

---

## Backend Tasks

The `GroupController`, `GroupModel`, `GroupMemberModel`, and `GroupInvitationModel` already exist. The following changes are required.

### 1. Rework `POST /groups/{id}/invite`

**Current behavior:** Accepts `invited_user_id` (raw UUID).
**Required behavior:** Accepts `email` and `role`. Looks up the user internally.

Request body:
```json
{ "email": "jane@example.com", "role": "member" }
```

Logic:
1. Verify requesting user is `owner` of group `{id}`.
2. Look up `users` table by `email`.
3. If not found → `HTTP 422` with `{ "error": "user_not_found" }`.
4. If user is already a member of this group → `HTTP 422` with `{ "error": "already_member" }`.
5. If a `pending` invitation already exists for this user+group → `HTTP 422` with `{ "error": "invitation_pending" }`.
6. Create invitation record with `invited_user_id`, `inviter_user_id`, `status = 'pending'`, random 64-char hex `token`, `expires_at = NOW() + 7 days`.
7. Store `role` in the invitation (add `role` column to `group_invitations` via migration — default `'member'`).
8. Return `HTTP 201` with `{ "token": "...", "expires_at": "..." }`.

### 2. Add `POST /groups/join`

New endpoint — accepts an invitation token from anyone who is authenticated.

Request body: `{ "token": "abc123..." }`

Logic:
1. Find invitation by `token` where `status = 'pending'`.
2. If not found → `HTTP 422` `{ "error": "invalid_token" }`.
3. If `expires_at` is in the past → `HTTP 422` `{ "error": "token_expired" }`.
4. If `invited_user_id != currentUserId` → `HTTP 403` `{ "error": "token_not_for_you" }`.
5. Insert `group_members` row with `group_id`, `user_id = currentUserId`, `role` from invitation, `joined_at = NOW()`.
6. Update invitation `status = 'accepted'`.
7. Return `HTTP 200` with the full group object (including `owner_name` — JOIN with users table).

### 3. Add `GET /groups/{id}/members`

Returns all members of the group (owner can see everyone; members can see everyone).

Response (array):
```json
[
  { "id": "...", "user_id": "...", "name": "Alice", "email": "alice@...", "role": "owner", "joined_at": "..." },
  { "id": "...", "user_id": "...", "name": "Bob",   "email": "bob@...",   "role": "member", "joined_at": "..." }
]
```

JOIN `group_members` with `users` to include `name` and `email`.

### 4. Add `DELETE /groups/{id}/members/{memberId}`

Owner-only. Removes a member. Returns `HTTP 204`.
- `memberId` is the `group_members.id` (not `user_id`).
- Cannot remove `owner` role entries.

### 5. Add `GET /groups/{id}/invitations`

Owner-only. Lists pending invitations for a group.

Response (array):
```json
[
  { "id": "...", "email": "jane@...", "role": "member", "expires_at": "...", "created_at": "..." }
]
```

JOIN `group_invitations` with `users` to include `email`. Only return `status = 'pending'`.

### 6. Add `DELETE /groups/{id}/invitations/{invitationId}`

Owner-only. Revokes a pending invitation. Updates `status = 'rejected'`. Returns `HTTP 204`.

### 7. Add `GET /groups/pending-invitations`

Returns invitations pending acceptance for the **current authenticated user**.

Response (array):
```json
[
  {
    "id": "...",
    "token": "...",
    "group_id": "...",
    "group_name": "Alice's Budget",
    "inviter_name": "Alice",
    "role": "member",
    "expires_at": "..."
  }
]
```

JOIN with `groups` and `users` (inviter). Only `status = 'pending'` and `expires_at > NOW()`.

### 8. Add `group_id` scoping to `GET /accounts`

In `AccountController::index()`:
- Accept optional `group_id` query param.
- If provided: verify current user is a `member` or `owner` of that group. If not → `HTTP 403`.
- If verified: return accounts where `user_id = group.owner_id` (the group owner's accounts, not the requester's).
- If not provided: current behavior (own accounts).

### 9. Add `group_id` scoping to `GET /transactions`

Same pattern in `TransactionController::index()`.
- If `group_id` provided: verify membership → return transactions where `user_id = group.owner_id`.

### 10. Add `group_id` scoping to `GET /dashboard/summary`

Same pattern in `DashboardController::summary()`.

### 11. Register all new routes

Add to `server/app/Config/Routes.php` inside the `groups` group:

```php
$routes->get('pending-invitations', 'GroupController::pendingInvitations');
$routes->post('join', 'GroupController::join');
$routes->get('(:segment)/members', 'GroupController::getMembers/$1');
$routes->delete('(:segment)/members/(:segment)', 'GroupController::removeMember/$1/$2');
$routes->get('(:segment)/invitations', 'GroupController::getInvitations/$1');
$routes->delete('(:segment)/invitations/(:segment)', 'GroupController::revokeInvitation/$1/$2');

// OPTIONS preflight for new routes
$routes->options('pending-invitations', static function () {});
$routes->options('join', static function () {});
$routes->options('(:segment)/members', static function () {});
$routes->options('(:segment)/members/(:segment)', static function () {});
$routes->options('(:segment)/invitations', static function () {});
$routes->options('(:segment)/invitations/(:segment)', static function () {});
```

**Route ordering matters:** `pending-invitations` and `join` must be registered BEFORE `(:segment)` routes to avoid being captured by the segment wildcard.

### 12. Migration: add `role` column to `group_invitations`

```sql
ALTER TABLE group_invitations ADD COLUMN role ENUM('member','viewer') NOT NULL DEFAULT 'member';
```

Create a CI4 migration file for this.

---

## Frontend Tasks

### New screens / routes

| Route | Component | Auth required |
|-------|-----------|---------------|
| `/join/:token` | `JoinBudget` screen | No (redirect to login if not authenticated) |

No separate "Groups" screen is added to the main menu. Everything is managed from **Settings**.

### Modified: `Settings.tsx` — new "Shared Budgets" section

Add a new section between Security and Preferences.

**Section: Shared Budgets**

Contains two subsections:

#### A) Budgets you share (budgets where you are the owner)

- Shows a list of groups you own with their member list.
- "Share My Budget" button → opens the Invite Dialog.
- Each group card shows:
  - Member rows: avatar initials circle, name, email, role `Badge`, "Remove" button (icon only).
  - Pending invitations list: email, role, expires, "Revoke" button.
- "Delete Shared Budget" at the bottom of each group card (owner only, with confirmation dialog).

**"Share My Budget" button behavior:**
- If user has no group yet → automatically creates a group named `"{Name}'s Budget"` on first invite, then sends invitation.
- If user already has a group → directly opens the invite dialog for that group.

#### B) Budgets you have access to (budgets you're a member/viewer of)

- Shows a list of shared budgets you have been granted access to.
- Each item: owner name, your role badge, "Leave" button.

#### C) Pending invitations (for the current user)

- If the user has any `pending-invitations`, show them here with an "Accept" and "Decline" button.
- Accepting immediately switches to that group's context.

---

### Invite Dialog

Trigger: "Share My Budget" button in Settings.

```
Title: "Invite Someone to View Your Budget"

[Email address input]                    ← Input component, required
[Role select: Member / Viewer]           ← Select component

⚠️ Warning (Message type="warning"):
   "Once [email] accepts this invitation, they will have complete
    visibility into ALL of your accounts and ALL of your transactions,
    including all historical data. They will see your budget exactly
    as you see it."

[Send Invitation]   [Cancel]
```

**Error states in the dialog:**
- `user_not_found` → `Message type="error"`: "No Monetka account found with this email address. Ask them to register at [app URL] first."
- `already_member` → `Message type="error"`: "This person already has access to your budget."
- `invitation_pending` → `Message type="warning"`: "An invitation is already pending for this email."

---

### AppBar: Budget Switcher

Show the budget switcher **only if** the user is a member of at least one shared budget (i.e., `listGroups` returns any group where the user is not the owner, OR the user is the owner of a group with members).

Render a `Select` in the AppBar (or a `Popout` if AppBar space is limited):

```
Options:
  { key: null,    value: "My Budget" }
  { key: "grp1",  value: "Alice's Budget" }   ← groups where you are member/viewer
```

On select: dispatch `setActiveGroup(groupId | null)` to the Redux store (`authSlice`).

**When a non-null group is active:**
- Show a persistent banner directly below the AppBar:
  ```
  ┌─────────────────────────────────────────────────────────┐
  │  👁  Viewing Alice's Budget  [role badge]  [My Budget]  │
  └─────────────────────────────────────────────────────────┘
  ```
  The "[My Budget]" on the right is a link/button that resets to personal context.

- If role is `viewer`: hide all "Add", "Edit", "Delete" action buttons on Transactions, Accounts, Categories.

---

### Modified: `authSlice.ts`

Add `activeGroupId: string | null` to the persisted state. Default `null`.

Add action `setActiveGroup(groupId: string | null)`.

---

### Modified: `api.ts` — new endpoints

```typescript
// Groups
listGroups: query → GET /groups           → Group[]
createGroup: mutation → POST /groups      → Group
updateGroup: mutation → PUT /groups/{id}  → Group
deleteGroup: mutation → DELETE /groups/{id}

// Members
getGroupMembers: query → GET /groups/{id}/members → GroupMember[]
removeMember: mutation → DELETE /groups/{id}/members/{memberId}

// Invitations
getGroupInvitations: query → GET /groups/{id}/invitations → GroupInvitation[]
inviteMember: mutation → POST /groups/{id}/invite  (body: { email, role })
revokeInvitation: mutation → DELETE /groups/{id}/invitations/{invitationId}

// Joining
getPendingInvitations: query → GET /groups/pending-invitations → PendingInvitation[]
joinGroup: mutation → POST /groups/join  (body: { token }) → Group

// RTK cache tag: 'Group'
```

All group mutations invalidate `['Group']`.

---

### Modified: `Transactions.tsx`, `Accounts.tsx`, `Dashboard.tsx`

Pass `group_id` query param when `activeGroupId` is not null:

```typescript
const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

// In query params:
...(activeGroupId && { group_id: activeGroupId })
```

In `Accounts.tsx` and `Transactions.tsx`: when `activeGroupId` is set and role is `viewer`, hide add/edit/delete buttons.

---

### New screen: `/join/:token`

Public route (no AuthWrapper). File: `client/src/screens/join/JoinBudget.tsx`.

**Flow:**
1. Extract `:token` from URL params.
2. If user is not authenticated (`!authSlice.token`): redirect to `/login?redirect=/join/{token}`.
3. If authenticated: call `getPendingInvitations` or directly call `joinGroup({ token })`.
4. Show a loading state while the join request is in flight.
5. **On success:**
   ```
   ✅ You now have access to Alice's Budget.
      [View Alice's Budget]   [Go to My Budget]
   ```
   Clicking "View Alice's Budget" dispatches `setActiveGroup(group.id)` and navigates to `/`.
6. **On error (`invalid_token`):** Message type="error": "This invitation link is invalid or has already been used."
7. **On error (`token_expired`):** Message type="error": "This invitation link has expired. Ask Alice to send a new one."
8. **On error (`token_not_for_you`):** Message type="error": "This invitation was sent to a different email address."

Add the route in `App.tsx`: `<Route path="/join/:token" element={<JoinBudget />} />` — **outside** `AuthWrapper`.

---

### API model types to add (`client/src/api/models/`)

```typescript
// group.ts
export interface Group {
    id: string
    owner_id: string
    name: string
    description?: string
    is_active: number
    created_at: string
    updated_at: string
}

export interface GroupMember {
    id: string
    group_id: string
    user_id: string
    name: string
    email: string
    role: 'owner' | 'member' | 'viewer'
    joined_at: string
}

export interface GroupInvitation {
    id: string
    group_id: string
    email: string
    role: 'member' | 'viewer'
    expires_at: string
    created_at: string
}

export interface PendingInvitation {
    id: string
    token: string
    group_id: string
    group_name: string
    inviter_name: string
    role: 'member' | 'viewer'
    expires_at: string
}
```

---

### Translations (i18n keys to add)

```
groups.shareMyBudget
groups.sharedBudgets
groups.budgetsYouShare
groups.budgetsYouAccess
groups.pendingInvitations
groups.noSharedBudgets
groups.viewingBudget
groups.myBudget
groups.inviteTitle
groups.inviteEmail
groups.inviteRole
groups.inviteRoleMember
groups.inviteRoleViewer
groups.inviteWarning
groups.sendInvitation
groups.inviteSent
groups.errorUserNotFound
groups.errorAlreadyMember
groups.errorInvitationPending
groups.revokeInvitation
groups.revokeConfirm
groups.removeMember
groups.removeConfirm
groups.leaveGroup
groups.leaveConfirm
groups.deleteGroup
groups.deleteConfirm
groups.role.owner
groups.role.member
groups.role.viewer
groups.joinTitle
groups.joinSuccess
groups.joinGoTo
groups.joinGoToMine
groups.errorInvalidToken
groups.errorTokenExpired
groups.errorTokenNotForYou
groups.expiresAt
groups.pendingBadge
```

---

## Acceptance Criteria

- [ ] Owner can invite a partner by typing their email address; a token is created.
- [ ] If the email has no account → clear error message in the dialog.
- [ ] If already a member / already pending → appropriate error message in the dialog.
- [ ] Invite dialog displays the explicit data-sharing warning before sending.
- [ ] Invitee can open `/join/{token}`, sees whose budget they're joining and what access they'll have, and accepts.
- [ ] Unauthenticated invitee is redirected to `/login?redirect=/join/{token}` and then auto-redirected back after login.
- [ ] After accepting, the AppBar switcher appears with the new shared budget.
- [ ] Switching to a shared budget shows a banner identifying the owner; Dashboard, Transactions, and Accounts all show the owner's data.
- [ ] Switching back to "My Budget" shows the user's own data.
- [ ] `viewer` role hides all add/edit/delete controls in Transactions, Accounts, and Categories screens.
- [ ] Owner can see the member list and pending invitations in Settings.
- [ ] Owner can revoke a pending invitation.
- [ ] Owner can remove a member (except themselves).
- [ ] Removed member's AppBar switcher no longer shows that group; switching to it falls back to personal.
- [ ] Owner can delete the shared budget entirely (confirmation required).
- [ ] All strings are translated (EN + RU).
- [ ] All UI uses `simple-react-ui-kit` components exclusively.
