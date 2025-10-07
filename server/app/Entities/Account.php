<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Account extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at', 'last_synced'];
    protected $casts = [
        'id'       => 'string',
        'user_id'  => 'string',
        'group_id' => '?string',
        'balance'  => 'float',
    ];
}