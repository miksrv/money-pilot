<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Group extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at'];
    protected $casts = [
        'id' => 'string',
        'owner_id' => 'string',
        'is_active' => 'boolean',
    ];
}