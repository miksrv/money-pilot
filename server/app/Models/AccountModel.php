<?php

namespace App\Models;

use App\Entities\Account;
use ReflectionException;

class AccountModel extends ApplicationBaseModel
{
    protected $table          = 'accounts';
    protected $primaryKey     = 'id';
    protected $allowedFields  = ['user_id', 'group_id', 'name', 'type', 'balance', 'institution', 'last_synced'];
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';

    protected $returnType     = Account::class;

    protected $useSoftDeletes   = false;
    protected $useTimestamps    = true;
    protected $useAutoIncrement = false;

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
        'user_id'     => 'permit_empty',
        'group_id'    => 'permit_empty',
        'name'        => 'required|string|max_length[100]',
        'type'        => 'required|in_list[checking,savings,credit,investment]',
        'balance'     => 'permit_empty|decimal',
        'institution' => 'permit_empty|string|max_length[100]',
        'last_synced' => 'permit_empty|valid_date',
    ];

    protected $validationMessages = [
        'user_id' => [
            'required' => 'User ID is required.',
            'valid_id' => 'Invalid user ID.',
        ],
        'group_id' => [
            'valid_id' => 'Invalid group ID.',
        ],
        'name' => [
            'required' => 'Account name is required.',
            'max_length' => 'Account name cannot exceed 100 characters.',
        ],
        'type' => [
            'required' => 'Account type is required.',
            'in_list' => 'Account type must be one of: checking, savings, credit, investment.',
        ],
        'balance' => [
            'decimal' => 'Balance must be a valid decimal number.',
        ],
        'institution' => [
            'max_length' => 'Institution name cannot exceed 100 characters.',
        ],
        'last_synced' => [
            'valid_date' => 'Invalid date format for last synced.',
        ],
    ];

    /**
     * Find accounts by user ID
     * @param string $userId
     * @return array
     */
    public function findByUserId(string $userId): array
    {
        return $this->where('user_id', $userId)->findAll();
    }

    /**
     * Find accounts by group ID
     * @param string $groupId
     * @return array
     */
    public function findByGroupId(string $groupId): array
    {
        return $this->where('group_id', $groupId)->findAll();
    }

    /**
     * Get account by ID and user ID
     * @param string $id
     * @param string $userId
     * @return array
     */
    public function getById(string $id, string $userId): array
    {
        return $this->where(['id' => $id, 'user_id' => $userId])->findAll();
    }

    /**
     * Update account by ID and user ID
     * @param string $id
     * @param string $userId
     * @param $data
     * @return bool
     * @throws ReflectionException
     */
    public function updateById(string $id, string $userId, $data): bool
    {
        return $this->where('user_id', $userId)->update($id, $data);
    }

    /**
     * Delete account by ID and user ID
     * @param string $id
     * @param string $userId
     * @return bool
     */
    public function deleteById(string $id, string $userId): bool
    {
        return $this->where('user_id', $userId)->delete($id);
    }
}