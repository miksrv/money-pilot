<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\GroupModel;
use App\Models\GroupMemberModel;
use App\Models\GroupInvitationModel;
use App\Models\SubscriptionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class GroupController extends ResourceController
{
    use ResponseTrait;

    protected Auth $authLibrary;
    protected GroupModel $groupModel;
    protected GroupMemberModel $groupMemberModel;
    protected GroupInvitationModel $groupInvitationModel;

    public function __construct()
    {
        $this->authLibrary          = new Auth();
        $this->groupModel           = new GroupModel();
        $this->groupMemberModel     = new GroupMemberModel();
        $this->groupInvitationModel = new GroupInvitationModel();
    }

    // ---------------------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------------------

    /**
     * Verify the current user is a member (any role) of the given group.
     * Returns the member row on success, null otherwise.
     */
    private function getMembership(string $groupId, string $userId): ?object
    {
        return $this->groupMemberModel
            ->where(['group_id' => $groupId, 'user_id' => $userId])
            ->first();
    }

    /**
     * Verify the current user is the owner of the given group.
     * Returns the member row on success, null otherwise.
     */
    private function getOwnerMembership(string $groupId, string $userId): ?object
    {
        return $this->groupMemberModel
            ->where(['group_id' => $groupId, 'user_id' => $userId, 'role' => 'owner'])
            ->first();
    }

    // ---------------------------------------------------------------------------
    // GET /groups — list groups the user belongs to
    // ---------------------------------------------------------------------------
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        $db = db_connect();
        $rows = $db->table('groups g')
            ->select('g.id, g.owner_id, g.name, g.description, g.is_active, g.created_at, g.updated_at, gm.role')
            ->join('group_members gm', 'gm.group_id = g.id')
            ->where('gm.user_id', $userId)
            ->get()
            ->getResultObject();

        return $this->respond($rows);
    }

    // ---------------------------------------------------------------------------
    // POST /groups — create a new group and add owner as member
    // ---------------------------------------------------------------------------
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        // Require an active paid subscription to create a group
        $subscriptionModel = new SubscriptionModel();
        if (!$subscriptionModel->hasActiveSubscription($userId)) {
            return $this->fail(
                ['error' => 'subscription_required', 'message' => 'An active paid subscription is required to create a group'],
                403
            );
        }

        $data   = $this->request->getJSON(true);
        $data['owner_id'] = $userId;

        if (!$this->groupModel->insert($data)) {
            return $this->fail($this->groupModel->errors());
        }

        $groupId = $this->groupModel->getInsertID();

        // Add the owner as a member with role 'owner'
        $this->groupMemberModel->insert([
            'group_id'  => $groupId,
            'user_id'   => $userId,
            'role'      => 'owner',
            'joined_at' => date('Y-m-d H:i:s'),
        ]);

        $group = $this->groupModel->find($groupId);
        return $this->respondCreated($group);
    }

    // ---------------------------------------------------------------------------
    // GET /groups/{id} — get a single group the user belongs to
    // ---------------------------------------------------------------------------
    public function show($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getMembership($id, $userId)) {
            return $this->failNotFound('Group not found or access denied');
        }

        $db  = db_connect();
        $row = $db->table('groups g')
            ->select('g.id, g.owner_id, g.name, g.description, g.is_active, g.created_at, g.updated_at, u.name as owner_name')
            ->join('users u', 'u.id = g.owner_id')
            ->where('g.id', $id)
            ->get()
            ->getRowObject();

        if (!$row) {
            return $this->failNotFound('Group not found');
        }

        return $this->respond($row);
    }

    // ---------------------------------------------------------------------------
    // PUT /groups/{id} — update group (owner only)
    // ---------------------------------------------------------------------------
    public function update($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getOwnerMembership($id, $userId)) {
            return $this->failForbidden('Only owner can update group');
        }

        $data = $this->request->getJSON(true);
        unset($data['id'], $data['owner_id']);

        if (!$this->groupModel->update($id, $data)) {
            return $this->fail($this->groupModel->errors());
        }

        $group = $this->groupModel->find($id);
        return $this->respondUpdated($group);
    }

    // ---------------------------------------------------------------------------
    // DELETE /groups/{id} — delete group (owner only)
    // ---------------------------------------------------------------------------
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getOwnerMembership($id, $userId)) {
            return $this->failForbidden('Only owner can delete group');
        }

        if (!$this->groupModel->delete($id)) {
            return $this->fail('Failed to delete group');
        }

        return $this->respondDeleted(['message' => 'Group deleted successfully']);
    }

    // ---------------------------------------------------------------------------
    // POST /groups/{id}/invite — invite a user by email (owner only)
    // ---------------------------------------------------------------------------
    public function invite($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getOwnerMembership($id, $userId)) {
            return $this->failForbidden('Only owner can invite members');
        }

        $data  = $this->request->getJSON(true);
        $email = $data['email'] ?? null;
        $role  = $data['role'] ?? 'editor';

        if (!$email) {
            return $this->failValidationErrors(['error' => 'email_required']);
        }

        if (!in_array($role, ['editor', 'viewer'], true)) {
            return $this->failValidationErrors(['error' => 'invalid_role']);
        }

        $db = db_connect();

        // Look up the invited user by email
        $invitedUser = $db->table('users')->where('email', $email)->get()->getRowObject();
        if (!$invitedUser) {
            return $this->failValidationErrors(['error' => 'user_not_found']);
        }

        $invitedUserId = $invitedUser->id;

        // Check if already a member
        if ($this->getMembership($id, $invitedUserId)) {
            return $this->failValidationErrors(['error' => 'already_member']);
        }

        // Check if a pending invitation already exists
        $existing = $this->groupInvitationModel
            ->where(['group_id' => $id, 'invited_user_id' => $invitedUserId, 'status' => 'pending'])
            ->first();
        if ($existing) {
            return $this->failValidationErrors(['error' => 'invitation_pending']);
        }

        $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));
        $token     = bin2hex(random_bytes(32));

        $inserted = $this->groupInvitationModel->insert([
            'group_id'        => $id,
            'invited_user_id' => $invitedUserId,
            'inviter_user_id' => $userId,
            'status'          => 'pending',
            'role'            => $role,
            'token'           => $token,
            'expires_at'      => $expiresAt,
        ]);

        if (!$inserted) {
            return $this->fail($this->groupInvitationModel->errors());
        }

        return $this->respondCreated(['token' => $token, 'expires_at' => $expiresAt]);
    }

    // ---------------------------------------------------------------------------
    // POST /groups/join — join a group via invitation token
    // ---------------------------------------------------------------------------
    public function join(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;
        $data   = $this->request->getJSON(true);
        $token  = $data['token'] ?? null;

        // Find pending invitation by token
        $invitation = $this->groupInvitationModel
            ->where(['token' => $token, 'status' => 'pending'])
            ->first();

        if (!$invitation) {
            return $this->failValidationErrors(['error' => 'invalid_token']);
        }

        if (strtotime($invitation->expires_at) < time()) {
            return $this->failValidationErrors(['error' => 'token_expired']);
        }

        if ($invitation->invited_user_id !== $userId) {
            return $this->failForbidden(['error' => 'token_not_for_you']);
        }

        // Insert group member
        $inserted = $this->groupMemberModel->insert([
            'group_id'  => $invitation->group_id,
            'user_id'   => $userId,
            'role'      => $invitation->role,
            'joined_at' => date('Y-m-d H:i:s'),
        ]);

        if (!$inserted) {
            return $this->fail($this->groupMemberModel->errors());
        }

        // Mark invitation as accepted
        $this->groupInvitationModel->update($invitation->id, ['status' => 'accepted']);

        // Return group with owner name
        $db  = db_connect();
        $row = $db->table('groups g')
            ->select('g.id, g.name, g.description, g.owner_id, u.name as owner_name')
            ->join('users u', 'u.id = g.owner_id')
            ->where('g.id', $invitation->group_id)
            ->get()
            ->getRowObject();

        return $this->respond($row);
    }

    // ---------------------------------------------------------------------------
    // GET /groups/{id}/members — list all members (any member may view)
    // ---------------------------------------------------------------------------
    public function getMembers($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getMembership($id, $userId)) {
            return $this->failForbidden('You are not a member of this group');
        }

        $db   = db_connect();
        $rows = $db->table('group_members gm')
            ->select('gm.id, gm.user_id, u.name, u.email, gm.role, gm.joined_at')
            ->join('users u', 'u.id = gm.user_id')
            ->where('gm.group_id', $id)
            ->get()
            ->getResultObject();

        return $this->respond($rows);
    }

    // ---------------------------------------------------------------------------
    // DELETE /groups/{id}/members/{memberId} — remove a member (owner only)
    // ---------------------------------------------------------------------------
    public function removeMember($groupId = null, $memberId = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getOwnerMembership($groupId, $userId)) {
            return $this->failForbidden('Only owner can remove members');
        }

        $memberRow = $this->groupMemberModel
            ->where(['id' => $memberId, 'group_id' => $groupId])
            ->first();

        if (!$memberRow) {
            return $this->failNotFound('Member not found');
        }

        if ($memberRow->role === 'owner') {
            return $this->fail(['error' => 'cannot_remove_owner'], 422);
        }

        $this->groupMemberModel->delete($memberId);

        return $this->respond(null, 204);
    }

    // ---------------------------------------------------------------------------
    // GET /groups/{id}/invitations — list pending invitations (owner only)
    // ---------------------------------------------------------------------------
    public function getInvitations($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getOwnerMembership($id, $userId)) {
            return $this->failForbidden('Only owner can view invitations');
        }

        $db   = db_connect();
        $rows = $db->table('group_invitations gi')
            ->select('gi.id, u.email, gi.role, gi.expires_at, gi.created_at')
            ->join('users u', 'u.id = gi.invited_user_id')
            ->where('gi.group_id', $id)
            ->where('gi.status', 'pending')
            ->get()
            ->getResultObject();

        return $this->respond($rows);
    }

    // ---------------------------------------------------------------------------
    // DELETE /groups/{id}/invitations/{invitationId} — revoke invitation (owner only)
    // ---------------------------------------------------------------------------
    public function revokeInvitation($groupId = null, $invitationId = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->getOwnerMembership($groupId, $userId)) {
            return $this->failForbidden('Only owner can revoke invitations');
        }

        $invitation = $this->groupInvitationModel
            ->where(['id' => $invitationId, 'group_id' => $groupId, 'status' => 'pending'])
            ->first();

        if (!$invitation) {
            return $this->failNotFound('Invitation not found');
        }

        $this->groupInvitationModel->update($invitationId, ['status' => 'rejected']);

        return $this->respond(null, 204);
    }

    // ---------------------------------------------------------------------------
    // GET /groups/pending-invitations — list pending invitations for current user
    // ---------------------------------------------------------------------------
    public function pendingInvitations(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized('Invalid token');
        }

        $userId = $this->authLibrary->user->id;

        $db   = db_connect();
        $rows = $db->table('group_invitations gi')
            ->select('gi.id, gi.token, gi.group_id, g.name as group_name, u.name as inviter_name, gi.role, gi.expires_at')
            ->join('groups g', 'g.id = gi.group_id')
            ->join('users u', 'u.id = gi.inviter_user_id')
            ->where('gi.invited_user_id', $userId)
            ->where('gi.status', 'pending')
            ->where('gi.expires_at >', date('Y-m-d H:i:s'))
            ->get()
            ->getResultObject();

        return $this->respond($rows);
    }
}
