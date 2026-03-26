<?php

namespace App\Models;

use App\Entities\GroupInvitation;

class GroupInvitationModel extends ApplicationBaseModel
{
    protected $table          = 'group_invitations';
    protected $primaryKey     = 'id';
    protected $useAutoIncrement = false;
    protected $returnType     = GroupInvitation::class;
    protected $useSoftDeletes = false;
    protected $allowedFields  = ['group_id', 'invited_user_id', 'inviter_user_id', 'status', 'role', 'token', 'expires_at'];
    protected $useTimestamps  = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = '';

    protected $allowCallbacks = true;
    protected $beforeInsert   = ['generateId'];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    protected $validationRules = [
        'group_id' => 'required',
        'invited_user_id' => 'required',
        'inviter_user_id' => 'required',
        'status' => 'required|in_list[pending,accepted,rejected]',
        'role' => 'required|in_list[member,viewer]',
        'token' => 'required|string|max_length[255]',
        'expires_at' => 'required|valid_date',
    ];

    protected $validationMessages = [
        'group_id' => [
            'required' => 'Group ID is required.',
        ],
        'invited_user_id' => [
            'required' => 'Invited user ID is required.',
        ],
        'inviter_user_id' => [
            'required' => 'Inviter user ID is required.',
        ],
        'status' => [
            'required' => 'Status is required.',
            'in_list' => 'Status must be pending, accepted, or rejected.',
        ],
        'role' => [
            'required' => 'Role is required.',
            'in_list' => 'Role must be member or viewer.',
        ],
        'token' => [
            'required' => 'Token is required.',
            'max_length' => 'Token cannot exceed 255 characters.',
        ],
        'expires_at' => [
            'required' => 'Expiration date is required.',
            'valid_date' => 'Invalid expiration date format.',
        ],
    ];

    /**
     * Find invitation by token
     */
    public function findByToken(string $token): ?GroupInvitation
    {
        return $this->where('token', $token)->first();
    }
}