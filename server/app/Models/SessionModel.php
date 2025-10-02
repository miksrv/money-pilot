<?php

namespace App\Models;

use App\Entities\Session;
use App\Entities\User;

class SessionModel extends ApplicationBaseModel
{
    protected $table          = 'sessions';
    protected $primaryKey     = 'id';
    protected $allowedFields  = ['id', 'user_id', 'token', 'device', 'ip_address', 'expires_at'];
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';

    protected $returnType     = Session::class;

    protected $useSoftDeletes   = false;
    protected $useTimestamps    = true;
    protected $useAutoIncrement = false;

    protected $allowCallbacks = true;
    protected $beforeInsert   = [];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    protected $validationRules = [
        'id'         => 'required|is_unique[sessions.id]',
        'user_id'    => 'required',
        'token'      => 'required|is_unique[sessions.token,id,{id}]',
        'device'     => 'permit_empty|string|max_length[255]',
        'ip_address' => 'permit_empty|valid_ip',
    ];

    protected $validationMessages = [
        'token' => [
            'required'  => 'Token is required.',
            'is_unique' => 'This token is already in use.',
        ],
        'user_id' => [
            'required' => 'User ID is required.',
        ],
    ];

    /**
     * Находит сессию по токену
     */
    public function findByToken(string $token): ?Session
    {
        return $this->where('token', $token)->first();
    }

    public function findByUserId(string $userId): ?Session
    {
        return $this->where('user_id', $userId)->first();
    }

    /**
     * Удаляет устаревшие сессии
     */
    public function deleteExpired(): void
    {
        $this->where('expires_at <', date('Y-m-d H:i:s'))->delete();
    }

    public function deleteByUserId(string $userId): void
    {
        $this->where('user_id', $userId)->delete();
    }

    /**
     * Gets the user associated with a given session ID and token.
     * @param string $sessionId
     * @param string $token
     * @return User|null
     */
    public function getUserBySessionId(string $sessionId, string $token): ?User
    {
        return model('UserModel')
            ->where('id', $this
                ->where('expires_at >', date('Y-m-d H:i:s'))
                ->where('token', $token)
                ->find($sessionId)->user_id)
            ->first();
    }
}