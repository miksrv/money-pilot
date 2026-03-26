<?php

namespace App\Models;

use App\Entities\GroupMember;

class GroupMemberModel extends ApplicationBaseModel
{
    protected $table          = 'group_members';
    protected $primaryKey     = 'id';
    protected $useAutoIncrement = false;
    protected $returnType     = GroupMember::class;
    protected $useSoftDeletes = false;
    protected $allowedFields  = ['group_id', 'user_id', 'role', 'joined_at'];
    protected $useTimestamps  = false;

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
        'user_id' => 'required',
        'role' => 'required|in_list[owner,member,viewer]',
        'joined_at' => 'required|valid_date',
    ];

    protected $validationMessages = [
        'group_id' => [
            'required' => 'Group ID is required.',
        ],
        'user_id' => [
            'required' => 'User ID is required.',
        ],
        'role' => [
            'required' => 'Role is required.',
            'in_list' => 'Role must be owner, member, or viewer.',
        ],
        'joined_at' => [
            'required' => 'Joined date is required.',
            'valid_date' => 'Invalid joined date format.',
        ],
    ];

    /**
     * Find members by group ID
     */
    public function findByGroupId(string $groupId): array
    {
        return $this->where('group_id', $groupId)->findAll();
    }
}