---
name: Phase 3 Shared Budget Feature Decisions
description: Key decisions and patterns from Feature 09 (Groups/Sharing) backend implementation
type: project
---

Phase 3 implements Shared Budget (Feature 09) using the existing `groups`, `group_members`, `group_invitations` tables. The GroupController was completely rewritten.

**Why:** The original GroupController used a non-existent static `Auth::getUserIdFromToken()` method. All other controllers use `new Auth()` + `$this->authLibrary->isAuth` / `$this->authLibrary->user->id`. The rewrite fixes this and adds all new endpoints.

**How to apply:** Always use the instance-based auth pattern in new controllers. Never use `Auth::getUserIdFromToken()`.

Key decisions:
- `group_invitations.role` column added via migration `2026-03-25-200000_AddRoleToGroupInvitations.php`. Default `'member'`.
- Invite flow: owner POSTs email+role → backend resolves user by email → returns token+expires_at. User ID never exposed to client.
- Join flow: `POST /groups/join` with `{ token }` — validates token, expiry, and that invited_user_id matches current user before inserting group_member.
- `pending-invitations` and `join` routes are registered BEFORE `(:segment)` wildcard to avoid route capture. This is the required ordering pattern for all future static sub-routes in CI4 groups.
- Group scoping pattern: AccountController, TransactionController, DashboardController all accept optional `?group_id=` query param. On group context: verify membership via GroupMemberModel, fetch group.owner_id, use that as the target user_id for data queries.
- `removeMember` prevents removal of `owner` role entries (returns 422 `cannot_remove_owner`).
- `getMembers` is accessible to any member (not owner-only), since all members can see who else has access.
- `revokeInvitation` sets status to `'rejected'` (not delete) to preserve audit trail.
