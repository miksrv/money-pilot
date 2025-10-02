<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Session extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at', 'expires_at'];
    protected $casts = [
        'id' => 'string',
        'user_id' => 'string',
    ];
}