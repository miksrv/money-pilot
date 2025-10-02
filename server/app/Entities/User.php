<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class User extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at', 'last_login'];
    protected $casts = [
        'id'        => 'string',
        'is_active' => 'boolean',
    ];

    /**
     * Хэширует пароль перед сохранением
     */
    public function setPasswordHash(string $password): void
    {
        $this->attributes['password'] = password_hash($password, PASSWORD_BCRYPT);
    }

    /**
     * Проверяет пароль
     */
    public function verifyPassword(string $password): bool
    {
        return password_verify($password, $this->attributes['password']);
    }
}