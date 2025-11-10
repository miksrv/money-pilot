<?php

namespace App\Models;

use App\Entities\Category;
use ReflectionException;

class CategoryModel extends ApplicationBaseModel
{
    protected $table          = 'categories';
    protected $primaryKey     = 'id';
    protected $allowedFields  = ['user_id', 'group_id', 'name', 'type', 'parent_id', 'icon', 'color', 'budget', 'usage_count'];
    protected $createdField   = 'created_at';
    protected $updatedField   = 'updated_at';

    protected $returnType     = Category::class;

    protected $useSoftDeletes   = false;
    protected $useTimestamps    = true;
    protected $useAutoIncrement = false;

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
        'user_id'     => 'permit_empty',
        'group_id'    => 'permit_empty',
        'name'        => 'required|string|max_length[100]',
        'type'        => 'required|in_list[income,expense]',
        'parent_id'   => 'permit_empty|valid_id[categories,id]',
        'icon'        => 'permit_empty|string|max_length[50]',
        'color'       => 'permit_empty|string|max_length[50]',
        'budget'      => 'permit_empty|decimal',
        'usage_count' => 'permit_empty|integer',
    ];

    protected $validationMessages = [
        'user_id' => [
            'required' => 'User ID is required.',
        ],
        'name' => [
            'required'   => 'Category name is required.',
            'max_length' => 'Category name cannot exceed 100 characters.',
        ],
        'type' => [
            'required' => 'Category type is required.',
            'in_list'  => 'Category type must be either income or expense.',
        ],
        'parent_id' => [
            'valid_id' => 'Invalid parent category ID.',
        ],
        'icon' => [
            'max_length' => 'Icon cannot exceed 50 characters.',
        ],
        'color' => [
            'max_length' => 'Color cannot exceed 50 characters.',
        ],
        'budget' => [
            'decimal' => 'Balance must be a valid decimal number.',
        ],
        'usage_count' => [
            'integer' => 'Usage count must be an integer.',
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
     * Find categories by user ID with transaction sums
     * @param string $userId
     * @return array
     */
    public function findByUserIdWithSums(string $userId): array
    {
        $reportDay   = 1; // Константа - день отчетного периода (1-е число месяца)
        $currentDate = new \DateTime();
        $reportStartDate = (clone $currentDate)->setDate($currentDate->format('Y'), $currentDate->format('m'), $reportDay)->format('Y-m-d');

        if ($currentDate->format('d') < $reportDay) {
            $reportStartDate = (clone $currentDate)->modify('-1 month')->setDate($currentDate->format('Y'), $currentDate->format('m'), $reportDay)->format('Y-m-d');
        }

        $categories = $this->where('user_id', $userId)->findAll();

        foreach ($categories as &$category) {
            $sum = $this->db->table('transactions')
                ->selectSum('amount')
                ->where('category_id', $category->id)
                ->where('type', 'expense')
                ->where('date >=', $reportStartDate)
                ->where('date <=', $currentDate->format('Y-m-d'))
                ->get()
                ->getRow()
                ->amount ?? 0;

            $category->expenses = (float) $sum;
            $category->budget   = (float) $category->budget ?? 0; // Assuming 'budget' field exists in categories
        }

        return $categories;
    }

    /**
     * Find categories by type (income/expense)
     */
    public function findByType(string $userId, string $type): array
    {
        return $this->where(['user_id' => $userId, 'type' => $type])->findAll();
    }

    /**
     * Find category by ID and user ID
     */
    public function getById(string $id): ?Category
    {
        return $this->where('id', $id)->first();
    }

    /**
     * Delete category by ID and user ID
     */
    public function deleteById(string $id, string $userId): bool
    {
        return $this->where('user_id', $userId)->delete($id);
    }

    /**
     * Update category by ID and user ID
     *
     * @param string $id
     * @param string $userId
     * @param array $data
     * @return bool
     */
    public function updateById(string $id, string $userId, array $data): bool
    {
        return $this->where(['id' => $id, 'user_id' => $userId])->set($data)->update();
    }

    /**
     * Increment usage count for a category
     *
     * @param string $categoryId
     * @return bool
     * @throws ReflectionException
     */
    public function incrementUsageCount(string $categoryId): bool
    {
        return $this->set('usage_count', 'usage_count + 1', false)
            ->where('id', $categoryId)
            ->update();
    }
}