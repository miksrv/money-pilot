<?php

namespace App\Entities;

use CodeIgniter\Entity\Entity;

class Transaction extends Entity
{
    protected $datamap = [];
    protected $dates = ['created_at', 'updated_at', 'date'];
    protected $casts = [
        'id'          => 'string',
        'user_id'     => 'string',
        'account_id'  => 'string',
        'category_id' => '?string',
        'payee_id'    => '?string',
        'amount'      => 'float',
        'type'        => 'string',
    ];
}