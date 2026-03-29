<?php

namespace App\Libraries;

class DefaultDataSeeder
{
    public function seed(string $userId, string $language, bool $demoData = true): void
    {
        if ($demoData === false) {
            return;
        }

        $this->createDefaultGroup($userId, $language);
        $categoryIds = $this->createDefaultCategories($userId, $language);
        $accountId   = $this->createDemoAccount($userId, $language);
        $this->createDemoTransactions($userId, $accountId, $language, $categoryIds);
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

    private function createDefaultCategories(string $userId, string $language): array
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

        // Second pass — insert child categories, collect IDs by name
        $childIds = [];
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
                $childIds[$tpl['name']] = $categoryModel->getInsertID();
            }
        }

        return $childIds;
    }

    private function createDemoAccount(string $userId, string $language): string
    {
        $name = $language === 'ru' ? 'Основной счёт' : 'Main Account';

        $accountModel = model('AccountModel');
        $accountModel->insert([
            'user_id' => $userId,
            'name'    => $name,
            'type'    => 'checking',
            'balance' => 3500.00,
        ]);

        return $accountModel->getInsertID();
    }

    private function createDemoTransactions(string $userId, string $accountId, string $language, array $categoryIds): void
    {
        $transactionModel = model('TransactionModel');

        $transactions = $language === 'ru'
            ? [
                ['type' => 'income',  'amount' => 85000.00, 'category' => 'Зарплата',  'days' => 25, 'notes' => 'Зарплата за месяц'],
                ['type' => 'expense', 'amount' => 3200.00,  'category' => 'Продукты',  'days' => 20, 'notes' => ''],
                ['type' => 'expense', 'amount' => 1800.00,  'category' => 'Рестораны', 'days' => 18, 'notes' => ''],
                ['type' => 'expense', 'amount' => 2500.00,  'category' => 'Топливо',   'days' => 15, 'notes' => ''],
                ['type' => 'expense', 'amount' => 399.00,   'category' => 'Подписки',  'days' => 12, 'notes' => 'Netflix'],
                ['type' => 'expense', 'amount' => 4500.00,  'category' => 'Коммуналка','days' => 10, 'notes' => ''],
                ['type' => 'expense', 'amount' => 2800.00,  'category' => 'Продукты',  'days' => 5,  'notes' => ''],
                ['type' => 'expense', 'amount' => 950.00,   'category' => 'Рестораны', 'days' => 2,  'notes' => ''],
            ]
            : [
                ['type' => 'income',  'amount' => 3500.00, 'category' => 'Salary',        'days' => 25, 'notes' => 'Monthly salary'],
                ['type' => 'expense', 'amount' => 85.40,   'category' => 'Groceries',     'days' => 20, 'notes' => ''],
                ['type' => 'expense', 'amount' => 32.00,   'category' => 'Restaurants',   'days' => 18, 'notes' => ''],
                ['type' => 'expense', 'amount' => 45.00,   'category' => 'Fuel',          'days' => 15, 'notes' => ''],
                ['type' => 'expense', 'amount' => 9.99,    'category' => 'Subscriptions', 'days' => 12, 'notes' => 'Netflix'],
                ['type' => 'expense', 'amount' => 120.00,  'category' => 'Utilities',     'days' => 10, 'notes' => ''],
                ['type' => 'expense', 'amount' => 67.30,   'category' => 'Groceries',     'days' => 5,  'notes' => ''],
                ['type' => 'expense', 'amount' => 24.50,   'category' => 'Restaurants',   'days' => 2,  'notes' => ''],
            ];

        foreach ($transactions as $tx) {
            $categoryId = $categoryIds[$tx['category']] ?? null;

            $transactionModel->insert([
                'user_id'     => $userId,
                'account_id'  => $accountId,
                'category_id' => $categoryId,
                'type'        => $tx['type'],
                'amount'      => $tx['amount'],
                'date'        => date('Y-m-d', strtotime('-' . $tx['days'] . ' days')),
                'notes'       => $tx['notes'],
            ]);
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
