<?php

namespace App\Models;

use ReflectionException;

class PayeeModel extends ApplicationBaseModel
{
    protected $table = 'payees';
    protected $primaryKey = 'id';

    protected $returnType = 'array';

    protected $useSoftDeletes = false;
    protected $useAutoIncrement = false;
    protected $protectFields = true;

    protected $allowedFields = [
        'id',
        'name',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $dateFormat    = 'datetime';

    protected $validationRules = [
        'name' => 'required|max_length[100]|is_unique[payees.name,id,{id}]',
    ];

    protected $validationMessages = [
        'name' => [
            'required'   => 'Payee name is required.',
            'max_length' => 'Payee name cannot exceed 100 characters.',
            'is_unique'  => 'This payee name already exists.',
        ],
    ];

    protected $skipValidation       = false;
    protected $cleanValidationRules = true;

    protected $allowCallbacks = true;
    protected $beforeInsert   = ['generateId'];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    /**
     * Find a global payee by name or create one, returning its ID.
     *
     * @throws ReflectionException
     */
    public function getOrCreateByName(string $name): string
    {
        $payee = $this->select('id')->where('name', $name)->first();

        if ($payee) {
            return $payee['id'];
        }

        $this->insert(['name' => $name], true);

        return $this->getInsertID();
    }
}
