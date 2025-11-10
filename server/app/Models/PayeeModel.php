<?php

namespace App\Models;

use App\Entities\Payee;
use ReflectionException;

class PayeeModel extends ApplicationBaseModel
{
    protected $table = 'payees';
    protected $primaryKey = 'id';

    protected $returnType = Payee::class;

    protected $useSoftDeletes = false;
    protected $useAutoIncrement = false;
    protected $protectFields = true;

    protected $allowedFields = [
        'id',
        'name',
        'created_by_user_id',
        'usage_count',
        'created_at',
        'updated_at',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $dateFormat    = 'datetime';

    protected $validationRules = [
        'name' => 'required|max_length[100]|is_unique[payees.name,id,{id}]',
        'created_by_user_id' => 'permit_empty|is_not_unique[users.id]',
    ];

    protected $validationMessages = [
        'name' => [
            'required' => 'Payee name is required.',
            'max_length' => 'Payee name cannot exceed 100 characters.',
            'is_unique' => 'This payee name already exists.',
        ],
        'created_by_user_id' => [
            'is_not_unique' => 'Invalid user ID.',
        ],
    ];

    protected $skipValidation = false;
    protected $cleanValidationRules = true;

    protected $allowCallbacks = true;
    protected $beforeInsert = ['generateId'];
    protected $afterInsert = [];
    protected $beforeUpdate = [];
    protected $afterUpdate = [];
    protected $beforeFind = [];
    protected $afterFind = [];
    protected $beforeDelete = [];
    protected $afterDelete = [];

    /**
     * @param string $name
     * @param string|null $createdByUserId
     * @return string
     * @throws ReflectionException
     */
    public function getOrCreateByName(string $name, string $createdByUserId = null): string
    {
        $payee = $this->select('id')->where('name', $name)->first();

        if ($payee) {
            $this->set('usage_count', 'usage_count + 1', false)
                ->where('id', $payee->id)
                ->update();

            return $payee->id;
        }

        $data = [
            'name'        => $name,
            'usage_count' => 1,
        ];

        if ($createdByUserId !== null) {
            $data['created_by_user_id'] = $createdByUserId;
        }

        $this->insert($data, true);

        return $this->getInsertID();
    }

}
