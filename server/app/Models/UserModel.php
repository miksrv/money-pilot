<?php

namespace App\Models;

use App\Entities\User;

class UserModel extends ApplicationBaseModel
{
    protected $table          = 'users';
    protected $primaryKey     = 'id';
    protected $allowedFields  = ['email', 'password', 'name', 'phone', 'is_active', 'last_login'];
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';

    protected $returnType     = User::class;

    protected $useSoftDeletes   = false;
    protected $useTimestamps    = true;
    protected $useAutoIncrement = false;

    protected $allowCallbacks = true;
    protected $beforeInsert   = ['generateId', 'hashPassword'];
    protected $afterInsert    = [];
    protected $beforeUpdate   = ['hashPassword'];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    public $validationRules = [
        'email'    => 'required|valid_email|is_unique[users.email,id,{id}]',
        'password' => 'required',
        'name'     => 'permit_empty|string|max_length[100]',
        'phone'    => 'permit_empty|string|max_length[20]',
    ];

    public $validationMessages = [
        'email' => [
            'required'    => 'Email is required.',
            'valid_email' => 'Please provide a valid email address.',
            'is_unique'   => 'This email is already registered.',
        ],
        'password' => [
            'required' => 'Password is required.',
        ],
    ];

    /**
     * Хэширует пароль перед сохранением
     */
    protected function hashPassword(array $data): array
    {
        if (!isset($data['data']['password'])) {
            return $data;
        }

        $data['data']['password'] = password_hash($data['data']['password'], PASSWORD_BCRYPT);

        return $data;
    }

    /**
     * Находит пользователя по email
     */
    public function findByEmail(string $email): ?User
    {
        return $this->where('email', $email)->first();
    }

    /**
     * Связь с sessions (one-to-many)
     */
    public function getSessions(int $userId): array
    {
        return model('SessionModel')->where('user_id', $userId)->findAll();
    }
}