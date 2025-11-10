<?php

namespace App\Models;

use App\Entities\Transaction;
use ReflectionException;

class TransactionModel extends ApplicationBaseModel
{
    protected $table         = 'transactions';
    protected $primaryKey    = 'id';
    protected $allowedFields = ['user_id', 'group_id', 'account_id', 'category_id', 'payee_id', 'amount', 'type', 'date'];
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';

    protected $returnType    = Transaction::class;

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
        'account_id'  => 'required',
        'category_id' => 'permit_empty',
        'payee_id'    => 'permit_empty',
        'amount'      => 'required|decimal',
        'type'        => 'required|in_list[income,expense]',
        'date'        => 'required|valid_date'
    ];

    protected $validationMessages = [
        'user_id' => [
            'required' => 'User ID is required.',
            'valid_id' => 'Invalid user ID.',
        ],
        'account_id' => [
            'required' => 'Account ID is required.',
            'valid_id' => 'Invalid account ID.',
        ],
        'category_id' => [
            'valid_id' => 'Invalid category ID.',
        ],
        'payee_id' => [
            'valid_id' => 'Invalid payee ID.',
        ],
        'amount' => [
            'required' => 'Amount is required.',
            'decimal' => 'Amount must be a valid decimal number.',
        ],
        'type' => [
            'required' => 'Transaction type is required.',
            'in_list' => 'Transaction type must be either income or expense.',
        ],
        'date' => [
            'required' => 'Transaction date is required.',
            'valid_date' => 'Invalid date format.',
        ]
    ];

    /**
     * Find transactions by user ID
     * @param string $userId
     * @return array
     */
    public function findByUserId(string $userId): array
    {
        return $this->select('transactions.*, payees.name as payee')
            ->join('payees', 'payees.id = transactions.payee_id', 'left')
            ->where('user_id', $userId)
            ->orderBy('date', 'DESC')
            ->findAll();
    }

    /**
     * Find transactions by account ID
     * @param string $accountId
     * @return array
     */
    public function findByAccountId(string $accountId): array
    {
        return $this->where('account_id', $accountId)->findAll();
    }

    /**
     * Get transaction by ID and user ID
     * @param string $id
     * @param string $userId
     * @return array
     */
    public function getById(string $id, string $userId): array
    {
        return $this->where(['id' => $id, 'user_id' => $userId])->findAll();
    }

    /**
     * Update transaction by ID and user ID
     * @param string $id
     * @param string $userId
     * @param mixed $data
     * @return bool
     * @throws ReflectionException
     */
    public function updateById(string $id, string $userId, $data): bool
    {
        return $this->where('user_id', $userId)->update($id, $data);
    }

    /**
     * Delete transaction by ID and user ID
     * @param string $id
     * @param string $userId
     * @return bool
     */
    public function deleteById(string $id, string $userId): bool
    {
        return $this->where('user_id', $userId)->delete($id);
    }
}