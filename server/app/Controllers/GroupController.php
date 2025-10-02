<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\GroupModel;
use App\Models\GroupMemberModel;
use App\Models\GroupInvitationModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class GroupController extends ResourceController
{
    use ResponseTrait;

    protected $groupModel;
    protected $groupMemberModel;
    protected $groupInvitationModel;

    public function __construct()
    {
        $this->groupModel = new GroupModel();
        $this->groupMemberModel = new GroupMemberModel();
        $this->groupInvitationModel = new GroupInvitationModel();
    }

    // GET /api/groups - Получить группы пользователя
    public function index()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $groups = $this->groupModel->join('group_members', 'groups.id = group_members.group_id')
            ->where('group_members.user_id', $userId)
            ->findAll();
        return $this->respond($groups);
    }

    // POST /api/groups - Создать группу
    public function create()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        $data['owner_id'] = $userId;

        if (!$this->groupModel->insert($data)) {
            return $this->fail($this->groupModel->errors());
        }

        // Добавить владельца в группу
        $this->groupMemberModel->insert([
            'group_id' => $data['id'],
            'user_id' => $userId,
            'role' => 'owner',
            'joined_at' => date('Y-m-d H:i:s'),
        ]);

        $group = $this->groupModel->find($data['id']);
        return $this->respondCreated($group);
    }

    // GET /api/groups/{id} - Получить группу по ID
    public function show($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $group = $this->groupModel->join('group_members', 'groups.id = group_members.group_id')
            ->where(['groups.id' => $id, 'group_members.user_id' => $userId])
            ->first();
        if (!$group) {
            return $this->failNotFound('Group not found or access denied');
        }

        return $this->respond($group);
    }

    // PUT /api/groups/{id} - Обновить группу
    public function update($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        unset($data['id'], $data['owner_id']);

        // Проверить, является ли пользователь владельцем
        $member = $this->groupMemberModel->where(['group_id' => $id, 'user_id' => $userId, 'role' => 'owner'])->first();
        if (!$member) {
            return $this->failForbidden('Only owner can update group');
        }

        if (!$this->groupModel->update($id, $data)) {
            return $this->fail($this->groupModel->errors());
        }

        $group = $this->groupModel->find($id);
        return $this->respondUpdated($group);
    }

    // DELETE /api/groups/{id} - Удалить группу
    public function delete($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $member = $this->groupMemberModel->where(['group_id' => $id, 'user_id' => $userId, 'role' => 'owner'])->first();
        if (!$member) {
            return $this->failForbidden('Only owner can delete group');
        }

        if (!$this->groupModel->delete($id)) {
            return $this->fail('Failed to delete group');
        }

        return $this->respondDeleted(['message' => 'Group deleted successfully']);
    }

    // POST /api/groups/{id}/invite - Пригласить пользователя в группу
    public function invite($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        $invitedUserId = $data['invited_user_id'] ?? null;

        if (!$invitedUserId) {
            return $this->failValidationErrors('Invited user ID is required');
        }

        // Проверить, является ли пользователь владельцем
        $member = $this->groupMemberModel->where(['group_id' => $id, 'user_id' => $userId, 'role' => 'owner'])->first();
        if (!$member) {
            return $this->failForbidden('Only owner can invite members');
        }

        $invitationData = [
            'group_id' => $id,
            'invited_user_id' => $invitedUserId,
            'inviter_user_id' => $userId,
            'status' => 'pending',
            'token' => bin2hex(random_bytes(32)),
            'expires_at' => date('Y-m-d H:i:s', strtotime('+7 days')),
        ];

        if (!$this->groupInvitationModel->insert($invitationData)) {
            return $this->fail($this->groupInvitationModel->errors());
        }

        return $this->respondCreated(['message' => 'Invitation sent', 'token' => $invitationData['token']]);
    }

    // POST /api/groups/{id}/members - Принять приглашение или добавить члена
    public function addMember($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        $token = $data['token'] ?? null;
        $role = $data['role'] ?? 'viewer';

        if ($token) {
            // Принять приглашение
            $invitation = $this->groupInvitationModel->where(['group_id' => $id, 'invited_user_id' => $userId, 'token' => $token, 'status' => 'pending'])->first();
            if (!$invitation) {
                return $this->failValidationErrors('Invalid invitation token');
            }

            $this->groupInvitationModel->update($invitation->id, ['status' => 'accepted']);

            $memberData = [
                'group_id' => $id,
                'user_id' => $userId,
                'role' => $role,
                'joined_at' => date('Y-m-d H:i:s'),
            ];

            if (!$this->groupMemberModel->insert($memberData)) {
                return $this->fail($this->groupMemberModel->errors());
            }

            return $this->respondCreated(['message' => 'Invitation accepted']);
        }

        // Добавить напрямую (только владелец)
        $member = $this->groupMemberModel->where(['group_id' => $id, 'user_id' => $userId, 'role' => 'owner'])->first();
        if (!$member) {
            return $this->failForbidden('Only owner can add members');
        }

        $addData = $this->request->getJSON(true);
        $addData['group_id'] = $id;
        $addData['joined_at'] = date('Y-m-d H:i:s');

        if (!$this->groupMemberModel->insert($addData)) {
            return $this->fail($this->groupMemberModel->errors());
        }

        return $this->respondCreated(['message' => 'Member added']);
    }
}