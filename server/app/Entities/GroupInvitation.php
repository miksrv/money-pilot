<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class GroupInvitation extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'expires_at'];
    protected $casts = [
        'id' => 'string',
        'group_id' => 'string',
        'invited_user_id' => 'string',
        'inviter_user_id' => 'string',
    ];
}