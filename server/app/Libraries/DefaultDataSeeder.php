<?php

namespace App\Libraries;

class DefaultDataSeeder
{
    public function seed(string $userId, string $language): void
    {
        $this->createDefaultGroup($userId, $language);
        $this->createDefaultCategories($userId, $language);
    }

    private function createDefaultGroup(string $userId, string $language): void
    {
        $name = $language === 'ru' ? 'Личный бюджет' : 'Personal';

        $groupModel = model('GroupModel');
        $groupModel->insert([
            'owner_id' => $userId,
            'name'     => $name,
        ]);

        $groupId = $groupModel->getInsertID();

        $memberModel = model('GroupMemberModel');
        $memberModel->insert([
            'group_id'  => $groupId,
            'user_id'   => $userId,
            'role'      => 'owner',
            'joined_at' => date('Y-m-d H:i:s'),
        ]);
    }

    private function createDefaultCategories(string $userId, string $language): void
    {
        $categoryModel = model('CategoryModel');
        $templates     = $this->getCategoryTemplates($language);

        // First pass — insert parent categories, remember their IDs by name
        $parentIds = [];
        foreach ($templates as $tpl) {
            if ($tpl['is_parent'] === 1) {
                $categoryModel->insert([
                    'user_id'   => $userId,
                    'name'      => $tpl['name'],
                    'type'      => $tpl['type'],
                    'is_parent' => 1,
                    'icon'      => $tpl['icon'],
                    'color'     => $tpl['color'],
                ]);
                $parentIds[$tpl['name']] = $categoryModel->getInsertID();
            }
        }

        // Second pass — insert child categories
        foreach ($templates as $tpl) {
            if ($tpl['is_parent'] === 0) {
                $parentId = $parentIds[$tpl['parent']] ?? null;
                $categoryModel->insert([
                    'user_id'   => $userId,
                    'name'      => $tpl['name'],
                    'type'      => $tpl['type'],
                    'is_parent' => 0,
                    'parent_id' => $parentId,
                    'icon'      => $tpl['icon'],
                    'color'     => $tpl['color'],
                ]);
            }
        }
    }

    private function getCategoryTemplates(string $language): array
    {
        $templates = [
            'en' => [
                ['name' => 'Income',         'type' => 'income',  'is_parent' => 1, 'icon' => '💰', 'color' => 'green'],
                ['name' => 'Salary',         'type' => 'income',  'is_parent' => 0, 'icon' => '💼', 'color' => 'green',  'parent' => 'Income'],
                ['name' => 'Freelance',      'type' => 'income',  'is_parent' => 0, 'icon' => '💻', 'color' => 'teal',   'parent' => 'Income'],
                ['name' => 'Gifts',          'type' => 'income',  'is_parent' => 0, 'icon' => '🎁', 'color' => 'lime',   'parent' => 'Income'],

                ['name' => 'Food',           'type' => 'expense', 'is_parent' => 1, 'icon' => '🍔', 'color' => 'orange'],
                ['name' => 'Groceries',      'type' => 'expense', 'is_parent' => 0, 'icon' => '🛒', 'color' => 'orange', 'parent' => 'Food'],
                ['name' => 'Restaurants',    'type' => 'expense', 'is_parent' => 0, 'icon' => '🍽️', 'color' => 'red',    'parent' => 'Food'],

                ['name' => 'Transport',      'type' => 'expense', 'is_parent' => 1, 'icon' => '🚗', 'color' => 'blue'],
                ['name' => 'Fuel',           'type' => 'expense', 'is_parent' => 0, 'icon' => '⛽', 'color' => 'blue',   'parent' => 'Transport'],
                ['name' => 'Public transit', 'type' => 'expense', 'is_parent' => 0, 'icon' => '🚌', 'color' => 'sky',    'parent' => 'Transport'],

                ['name' => 'Shopping',       'type' => 'expense', 'is_parent' => 1, 'icon' => '🛍️', 'color' => 'purple'],
                ['name' => 'Clothing',       'type' => 'expense', 'is_parent' => 0, 'icon' => '👕', 'color' => 'purple', 'parent' => 'Shopping'],
                ['name' => 'Electronics',    'type' => 'expense', 'is_parent' => 0, 'icon' => '📱', 'color' => 'indigo', 'parent' => 'Shopping'],

                ['name' => 'Health',         'type' => 'expense', 'is_parent' => 1, 'icon' => '💊', 'color' => 'pink'],
                ['name' => 'Pharmacy',       'type' => 'expense', 'is_parent' => 0, 'icon' => '🏥', 'color' => 'pink',   'parent' => 'Health'],
                ['name' => 'Sport',          'type' => 'expense', 'is_parent' => 0, 'icon' => '🏋️', 'color' => 'lime',   'parent' => 'Health'],

                ['name' => 'Housing',        'type' => 'expense', 'is_parent' => 1, 'icon' => '🏠', 'color' => 'yellow'],
                ['name' => 'Rent',           'type' => 'expense', 'is_parent' => 0, 'icon' => '🔑', 'color' => 'yellow', 'parent' => 'Housing'],
                ['name' => 'Utilities',      'type' => 'expense', 'is_parent' => 0, 'icon' => '💡', 'color' => 'amber',  'parent' => 'Housing'],

                ['name' => 'Entertainment',  'type' => 'expense', 'is_parent' => 1, 'icon' => '🎮', 'color' => 'violet'],
                ['name' => 'Subscriptions',  'type' => 'expense', 'is_parent' => 0, 'icon' => '📺', 'color' => 'violet', 'parent' => 'Entertainment'],
            ],
            'ru' => [
                ['name' => 'Доходы',        'type' => 'income',  'is_parent' => 1, 'icon' => '💰', 'color' => 'green'],
                ['name' => 'Зарплата',      'type' => 'income',  'is_parent' => 0, 'icon' => '💼', 'color' => 'green',  'parent' => 'Доходы'],
                ['name' => 'Фриланс',       'type' => 'income',  'is_parent' => 0, 'icon' => '💻', 'color' => 'teal',   'parent' => 'Доходы'],
                ['name' => 'Подарки',       'type' => 'income',  'is_parent' => 0, 'icon' => '🎁', 'color' => 'lime',   'parent' => 'Доходы'],

                ['name' => 'Еда',           'type' => 'expense', 'is_parent' => 1, 'icon' => '🍔', 'color' => 'orange'],
                ['name' => 'Продукты',      'type' => 'expense', 'is_parent' => 0, 'icon' => '🛒', 'color' => 'orange', 'parent' => 'Еда'],
                ['name' => 'Рестораны',     'type' => 'expense', 'is_parent' => 0, 'icon' => '🍽️', 'color' => 'red',    'parent' => 'Еда'],

                ['name' => 'Транспорт',     'type' => 'expense', 'is_parent' => 1, 'icon' => '🚗', 'color' => 'blue'],
                ['name' => 'Топливо',       'type' => 'expense', 'is_parent' => 0, 'icon' => '⛽', 'color' => 'blue',   'parent' => 'Транспорт'],
                ['name' => 'Общественный',  'type' => 'expense', 'is_parent' => 0, 'icon' => '🚌', 'color' => 'sky',    'parent' => 'Транспорт'],

                ['name' => 'Покупки',       'type' => 'expense', 'is_parent' => 1, 'icon' => '🛍️', 'color' => 'purple'],
                ['name' => 'Одежда',        'type' => 'expense', 'is_parent' => 0, 'icon' => '👕', 'color' => 'purple', 'parent' => 'Покупки'],
                ['name' => 'Электроника',   'type' => 'expense', 'is_parent' => 0, 'icon' => '📱', 'color' => 'indigo', 'parent' => 'Покупки'],

                ['name' => 'Здоровье',      'type' => 'expense', 'is_parent' => 1, 'icon' => '💊', 'color' => 'pink'],
                ['name' => 'Аптека',        'type' => 'expense', 'is_parent' => 0, 'icon' => '🏥', 'color' => 'pink',   'parent' => 'Здоровье'],
                ['name' => 'Спорт',         'type' => 'expense', 'is_parent' => 0, 'icon' => '🏋️', 'color' => 'lime',   'parent' => 'Здоровье'],

                ['name' => 'Жильё',         'type' => 'expense', 'is_parent' => 1, 'icon' => '🏠', 'color' => 'yellow'],
                ['name' => 'Аренда',        'type' => 'expense', 'is_parent' => 0, 'icon' => '🔑', 'color' => 'yellow', 'parent' => 'Жильё'],
                ['name' => 'Коммуналка',    'type' => 'expense', 'is_parent' => 0, 'icon' => '💡', 'color' => 'amber',  'parent' => 'Жильё'],

                ['name' => 'Развлечения',   'type' => 'expense', 'is_parent' => 1, 'icon' => '🎮', 'color' => 'violet'],
                ['name' => 'Подписки',      'type' => 'expense', 'is_parent' => 0, 'icon' => '📺', 'color' => 'violet', 'parent' => 'Развлечения'],
            ],
        ];

        return $templates[$language] ?? $templates['en'];
    }
}
