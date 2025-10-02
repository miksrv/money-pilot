<?php

namespace App\Models;

use App\Entities\Group;

class GroupModel extends ApplicationBaseModel
{
    protected $table          = 'groups';
    protected $primaryKey     = 'id';
    protected $returnType     = Group::class;
    protected $useSoftDeletes = false;
    protected $allowedFields  = ['owner_id', 'name', 'description', 'is_active'];
    protected $useTimestamps  = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';

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
        'owner_id' => 'required|valid_id[users,id]',
        'name' => 'required|string|max_length[100]',
        'description' => 'permit_empty|string|max_length[255]',
        'is_active' => 'permit_empty|boolean',
    ];

    protected $validationMessages = [
        'owner_id' => [
            'required' => 'Owner ID is required.',
            'valid_id' => 'Invalid owner ID.',
        ],
        'name' => [
            'required' => 'Group name is required.',
            'max_length' => 'Group name cannot exceed 100 characters.',
        ],
        'description' => [
            'max_length' => 'Description cannot exceed 255 characters.',
        ],
    ];

    /**
     * Find groups by user ID (via group_members)
     */
    public function findByUserId(string $userId): array
    {
        return $this->join('group_members', 'groups.id = group_members.group_id')
            ->where('group_members.user_id', $userId)
            ->findAll();
    }
}