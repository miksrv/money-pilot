<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Category extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at'];
    protected $casts = [
        'id'        => 'string',
        'user_id'   => 'string',
        'group_id'  => '?string',
        'parent_id' => '?string',
        'icon'      => '?string',
        'color'     => '?string',
        'budget'    => 'float',
    ];
}