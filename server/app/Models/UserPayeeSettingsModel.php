<?php

namespace App\Models;

use ReflectionException;

class UserPayeeSettingsModel extends ApplicationBaseModel
{
    protected $table = 'user_payee_settings';
    protected $primaryKey = 'id';

    protected $returnType = 'array';

    protected $useSoftDeletes = false;
    protected $useAutoIncrement = false;
    protected $protectFields = true;

    protected $allowedFields = [
        'id',
        'user_id',
        'payee_id',
        'default_category_id',
        'default_account_id',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $dateFormat    = 'datetime';

    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    protected $allowCallbacks = true;
    protected $beforeInsert   = ['generateId'];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    /**
     * Retrieve the settings row for a specific user + payee combination.
     */
    public function getByUserAndPayee(string $userId, string $payeeId): ?array
    {
        return $this->where('user_id', $userId)
            ->where('payee_id', $payeeId)
            ->first();
    }

    /**
     * Insert or update the user's settings for a given payee.
     *
     * @throws ReflectionException
     */
    public function upsertForUser(string $userId, string $payeeId, array $data): void
    {
        $existing = $this->getByUserAndPayee($userId, $payeeId);

        $payload = array_intersect_key($data, array_flip(['default_category_id', 'default_account_id']));

        if ($existing) {
            $this->where('user_id', $userId)
                ->where('payee_id', $payeeId)
                ->set($payload)
                ->update();
        } else {
            $this->insert(array_merge($payload, [
                'user_id'  => $userId,
                'payee_id' => $payeeId,
            ]));
        }
    }
}
