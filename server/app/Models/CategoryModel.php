<?php

namespace App\Models;

use App\Entities\Category;

class CategoryModel extends ApplicationBaseModel
{
    protected $table          = 'categories';
    protected $primaryKey     = 'id';
    protected $returnType     = Category::class;
    protected $useSoftDeletes = false;
    protected $allowedFields  = ['user_id', 'name', 'type', 'parent_id', 'is_active'];
    protected $useTimestamps  = true;
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';

    protected $allowCallbacks = true;
    protected $beforeInsert   = ['generateId'];
    protected $afterInsert    = [];
    protected $beforeUpdate   = [];
    protected $afterUpdate    = [];
    protected $beforeFind     = [];
    protected $afterFind      = [];
    protected $beforeDelete   = [];
    protected $afterDelete    = [];

    protected $validationRules = [
        'user_id'   => 'required',
        'name'      => 'required|string|max_length[100]',
        'type'      => 'required|in_list[income,expense]',
        'parent_id' => 'permit_empty|valid_id[categories,id]',
        'is_active' => 'permit_empty|boolean',
    ];

    protected $validationMessages = [
        'user_id' => [
            'required' => 'User ID is required.',
        ],
        'name' => [
            'required' => 'Category name is required.',
            'max_length' => 'Category name cannot exceed 100 characters.',
        ],
        'type' => [
            'required' => 'Category type is required.',
            'in_list' => 'Category type must be either income or expense.',
        ],
        'parent_id' => [
            'valid_id' => 'Invalid parent category ID.',
        ],
    ];

    /**
     * Find categories by user ID
     */
    public function findByUserId(string $userId): array
    {
        return $this->where('user_id', $userId)->findAll();
    }

    /**
     * Find categories by type (income/expense)
     */
    public function findByType(string $userId, string $type): array
    {
        return $this->where(['user_id' => $userId, 'type' => $type])->findAll();
    }
}