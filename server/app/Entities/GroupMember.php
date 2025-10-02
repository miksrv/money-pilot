<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class GroupMember extends Entity
{
    protected $datamap = [];
    protected $dates = ['joined_at'];
    protected $casts = [
        'id' => 'string',
        'group_id' => 'string',
        'user_id' => 'string',
    ];
}