<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Payee extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at'];
    protected $casts = [
        'id'                 => 'string',
        'name'               => 'string',
        'created_by_user_id' => '?string',
        'usage_count'        => 'int',
        'created_at'         => 'datetime',
        'updated_at'         => 'datetime',
    ];

    protected $attributes = [
        'id'                 => null,
        'name'               => null,
        'created_by_user_id' => null,
        'usage_count'        => 0,
        'created_at'         => null,
        'updated_at'         => null,
    ];
}