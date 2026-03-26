<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class SeedTestData extends BaseCommand
{
    protected $group       = 'Database';
    protected $name        = 'seed:test';
    protected $description = 'Seed database with two test users and realistic financial test data';

    public function run(array $params)
    {
        $db = db_connect();

        // ---------------------------------------------------------------
        // Step 1 — Clear data
        // ---------------------------------------------------------------
        CLI::write('Clearing database...', 'yellow');

        $db->query('SET FOREIGN_KEY_CHECKS = 0');

        foreach ([
            'sessions',
            'group_invitations',
            'group_members',
            'groups',
            'recurring_transactions',
            'transactions',
            'accounts',
            'categories',
            'payees',
            'users',
        ] as $table) {
            $db->table($table)->truncate();
        }

        $db->query('SET FOREIGN_KEY_CHECKS = 1');

        // ---------------------------------------------------------------
        // Step 2 — Create users
        // ---------------------------------------------------------------
        CLI::write('Creating users...', 'yellow');

        $now      = date('Y-m-d H:i:s');
        $password = password_hash('123456', PASSWORD_BCRYPT);

        $user1Id = uniqid();
        $user2Id = uniqid();

        $db->table('users')->insert([
            'id'         => $user1Id,
            'email'      => 'test1@test.com',
            'name'       => 'Alex Johnson',
            'password'   => $password,
            'currency'   => 'USD',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        $db->table('users')->insert([
            'id'         => $user2Id,
            'email'      => 'test2@test.com',
            'name'       => 'Maria Smith',
            'password'   => $password,
            'currency'   => 'USD',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // ---------------------------------------------------------------
        // Step 3 — Create accounts (per user)
        // ---------------------------------------------------------------
        CLI::write('Creating accounts...', 'yellow');

        $accountDefs = [
            ['name' => 'Checking Account', 'type' => 'checking', 'balance' => 5000.00],
            ['name' => 'Savings Account',  'type' => 'savings',  'balance' => 12000.00],
            ['name' => 'Credit Card',      'type' => 'credit',   'balance' => 0.00],
        ];

        // [userId => [accountName => accountId]]
        $accounts = [];

        foreach ([$user1Id, $user2Id] as $userId) {
            $accounts[$userId] = [];
            foreach ($accountDefs as $def) {
                $id = uniqid();
                $db->table('accounts')->insert([
                    'id'         => $id,
                    'user_id'    => $userId,
                    'name'       => $def['name'],
                    'type'       => $def['type'],
                    'balance'    => $def['balance'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $accounts[$userId][$def['name']] = $id;
            }
        }

        // ---------------------------------------------------------------
        // Step 4 — Create categories (per user)
        // Using allowed colors from ColorPicker.tsx
        // Parent categories and their children
        // ---------------------------------------------------------------
        CLI::write('Creating categories...', 'yellow');

        // Parent categories (no budget, transactions should not be assigned to them)
        $parentCategoryDefs = [
            ['name' => 'Home',           'type' => 'expense', 'color' => 'blue', 'is_parent' => 1],
            ['name' => 'Transportation', 'type' => 'expense', 'color' => 'cyan', 'is_parent' => 1],
        ];

        // Child categories with their parent name
        $childCategoryDefs = [
            // Home children
            ['name' => 'Rent',      'type' => 'expense', 'color' => 'blue',    'icon' => '🏠', 'budget' => 2000.00, 'parent' => 'Home'],
            ['name' => 'Phone',     'type' => 'expense', 'color' => 'blue',    'icon' => '📱', 'budget' => 100.00,  'parent' => 'Home'],
            ['name' => 'Utilities', 'type' => 'expense', 'color' => 'blue',    'icon' => '💡', 'budget' => 250.00,  'parent' => 'Home'],
            ['name' => 'Internet',  'type' => 'expense', 'color' => 'blue',    'icon' => '📶', 'budget' => 100.00,  'parent' => 'Home'],
            // Transportation children
            ['name' => 'Car Insurance', 'type' => 'expense', 'color' => 'cyan', 'icon' => '🛡️', 'budget' => 150.00,  'parent' => 'Transportation'],
            ['name' => 'Gas',           'type' => 'expense', 'color' => 'cyan', 'icon' => '⛽', 'budget' => 200.00,  'parent' => 'Transportation'],
            ['name' => 'Service',       'type' => 'expense', 'color' => 'cyan', 'icon' => '🔧', 'budget' => 100.00,  'parent' => 'Transportation'],
            ['name' => 'FastTrack',     'type' => 'expense', 'color' => 'cyan', 'icon' => '🛣️', 'budget' => 50.00,   'parent' => 'Transportation'],
        ];

        // Standalone categories (no parent)
        $standaloneCategoryDefs = [
            ['name' => 'Restaurants',   'type' => 'expense', 'color' => 'orange',  'icon' => '🍽️',  'budget' => 300.00],
            ['name' => 'Groceries',     'type' => 'expense', 'color' => 'green',   'icon' => '🛒',  'budget' => 600.00],
            ['name' => 'Entertainment', 'type' => 'expense', 'color' => 'purple',  'icon' => '🎬',  'budget' => 150.00],
            ['name' => 'Gifts',         'type' => 'expense', 'color' => 'magenta', 'icon' => '🎁',  'budget' => 100.00],
            ['name' => 'Health',        'type' => 'expense', 'color' => 'red',     'icon' => '💊',  'budget' => 100.00],
            ['name' => 'Shopping',      'type' => 'expense', 'color' => 'olive',   'icon' => '🛍️',  'budget' => 400.00],
            ['name' => 'Salary',        'type' => 'income',  'color' => 'lime',    'icon' => '💼',  'budget' => null],
        ];

        // [userId => [categoryName => categoryId]]
        $categories = [];

        foreach ([$user1Id, $user2Id] as $userId) {
            $categories[$userId] = [];

            // Create parent categories first
            foreach ($parentCategoryDefs as $def) {
                $id = uniqid();
                $db->table('categories')->insert([
                    'id'         => $id,
                    'user_id'    => $userId,
                    'name'       => $def['name'],
                    'type'       => $def['type'],
                    'color'      => $def['color'],
                    'icon'       => $def['icon'] ?? null,
                    'is_parent'  => $def['is_parent'] ?? null,
                    'budget'     => null,
                    'parent_id'  => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $categories[$userId][$def['name']] = $id;
            }

            // Create child categories with parent_id
            foreach ($childCategoryDefs as $def) {
                $id = uniqid();
                $parentId = $categories[$userId][$def['parent']];
                $db->table('categories')->insert([
                    'id'         => $id,
                    'user_id'    => $userId,
                    'name'       => $def['name'],
                    'type'       => $def['type'],
                    'color'      => $def['color'],
                    'icon'       => $def['icon'],
                    'budget'     => $def['budget'],
                    'parent_id'  => $parentId,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $categories[$userId][$def['name']] = $id;
            }

            // Create standalone categories
            foreach ($standaloneCategoryDefs as $def) {
                $id = uniqid();
                $db->table('categories')->insert([
                    'id'         => $id,
                    'user_id'    => $userId,
                    'name'       => $def['name'],
                    'type'       => $def['type'],
                    'color'      => $def['color'],
                    'icon'       => $def['icon'],
                    'budget'     => $def['budget'],
                    'parent_id'  => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
                $categories[$userId][$def['name']] = $id;
            }
        }

        // ---------------------------------------------------------------
        // Step 5 — Create payees
        // ---------------------------------------------------------------
        CLI::write('Creating payees...', 'yellow');

        // Payee lists per category (using child categories for transactions)
        $payeeDefs = [
            'Groceries'     => ['Walmart', 'Whole Foods', 'Trader Joe\'s', 'Kroger', 'Costco', 'Aldi'],
            'Restaurants'   => ['McDonald\'s', 'Chipotle', 'Olive Garden', 'Uber Eats', 'DoorDash', 'Panera Bread'],
            'Entertainment' => ['Netflix', 'Spotify', 'AMC Theaters', 'Steam', 'Apple TV+', 'Hulu'],
            'Health'        => ['CVS Pharmacy', 'Walgreens', 'LabCorp', 'Kaiser Clinic', 'One Medical'],
            'Shopping'      => ['Amazon', 'Target', 'Best Buy', 'IKEA', 'Zara', 'H&M'],
            'Gifts'         => ['Amazon Gift', 'Etsy', 'Hallmark'],
            'Salary'        => ['Employer Inc'],
            // Home children
            'Rent'          => ['Landlord LLC', 'Property Management'],
            'Phone'         => ['AT&T', 'Verizon', 'T-Mobile'],
            'Utilities'     => ['PG&E Electric', 'City Water', 'National Gas'],
            'Internet'      => ['Comcast', 'Spectrum', 'AT&T Fiber'],
            // Transportation children
            'Car Insurance' => ['Geico', 'State Farm', 'Progressive'],
            'Gas'           => ['Shell', 'BP Gas', 'Chevron', 'ExxonMobil'],
            'Service'       => ['Jiffy Lube', 'Firestone', 'Pep Boys'],
            'FastTrack'     => ['FasTrak', 'E-ZPass'],
        ];

        // Flatten all payee names to create unique payees
        $allPayeeNames = [];
        foreach ($payeeDefs as $categoryPayees) {
            foreach ($categoryPayees as $name) {
                $allPayeeNames[$name] = true;
            }
        }

        // [payeeName => payeeId] (global, not per user)
        $payees = [];

        foreach (array_keys($allPayeeNames) as $payeeName) {
            $id = uniqid();
            $db->table('payees')->insert([
                'id'                 => $id,
                'name'               => $payeeName,
                'created_by_user_id' => $user1Id, // First user as creator
                'usage_count'        => 0,
                'created_at'         => $now,
                'updated_at'         => $now,
            ]);
            $payees[$payeeName] = $id;
        }

        // ---------------------------------------------------------------
        // Step 6 — Create transactions
        // ---------------------------------------------------------------
        CLI::write('Creating transactions...', 'yellow');

        mt_srand(42);

        $today         = new \DateTime();
        $totalCreated  = 0;

        // Compute the two month ranges to cover
        $prevMonthStart = (clone $today)->modify('first day of last month')->setTime(0, 0, 0);
        $prevMonthEnd   = (clone $today)->modify('last day of last month')->setTime(0, 0, 0);
        $currMonthStart = (clone $today)->modify('first day of this month')->setTime(0, 0, 0);
        $currMonthEnd   = clone $today;

        $ranges = [
            ['start' => $prevMonthStart, 'end' => $prevMonthEnd],
            ['start' => $currMonthStart, 'end' => $currMonthEnd],
        ];

        foreach ([$user1Id, $user2Id] as $userId) {
            $checkingId   = $accounts[$userId]['Checking Account'];
            $creditCardId = $accounts[$userId]['Credit Card'];

            foreach ($ranges as $range) {
                $rangeLabel = $range['start']->format('F Y');
                CLI::write("Creating transactions for {$rangeLabel}...", 'yellow');

                $startTs = $range['start']->getTimestamp();
                $endTs   = $range['end']->getTimestamp();

                // ------ Income: Salary on the 1st ------
                $salaryDate = $range['start']->format('Y-m-d');
                $this->insertTransaction(
                    $db,
                    $userId,
                    $checkingId,
                    $categories[$userId]['Salary'],
                    'income',
                    4500.00,
                    $salaryDate,
                    $payees['Employer Inc'],
                    'Monthly salary deposit'
                );
                $totalCreated++;

                // ------ Home bills: Rent on the 1st, others around 5th–10th ------
                // Rent on the 1st
                $rentDate = $range['start']->format('Y-m-d');
                $rentPayeeName = $payeeDefs['Rent'][mt_rand(0, count($payeeDefs['Rent']) - 1)];
                $this->insertTransaction(
                    $db,
                    $userId,
                    $checkingId,
                    $categories[$userId]['Rent'],
                    'expense',
                    1800.00,
                    $rentDate,
                    $payees[$rentPayeeName],
                    'Monthly rent payment'
                );
                $totalCreated++;

                // Home bills: Phone, Utilities, Internet
                $homeBills = [
                    ['category' => 'Phone',     'payees' => $payeeDefs['Phone'],     'amount' => 85.00,  'day' => 5,  'note' => 'Monthly phone bill'],
                    ['category' => 'Utilities', 'payees' => $payeeDefs['Utilities'], 'amount' => 165.00, 'day' => 8,  'note' => 'Electricity/Gas bill'],
                    ['category' => 'Internet',  'payees' => $payeeDefs['Internet'],  'amount' => 80.00,  'day' => 7,  'note' => 'Internet service'],
                ];
                foreach ($homeBills as $bill) {
                    $billDay = (clone $range['start'])->setDate(
                        (int)$range['start']->format('Y'),
                        (int)$range['start']->format('m'),
                        $bill['day']
                    );
                    if ($billDay->getTimestamp() <= $endTs) {
                        $payeeName = $bill['payees'][mt_rand(0, count($bill['payees']) - 1)];
                        $this->insertTransaction(
                            $db,
                            $userId,
                            $creditCardId,
                            $categories[$userId][$bill['category']],
                            'expense',
                            $bill['amount'],
                            $billDay->format('Y-m-d'),
                            $payees[$payeeName],
                            $bill['note']
                        );
                        $totalCreated++;
                    }
                }

                // ------ Transportation: Car Insurance on the 15th ------
                $day15 = (clone $range['start'])->setDate(
                    (int)$range['start']->format('Y'),
                    (int)$range['start']->format('m'),
                    15
                );
                if ($day15->getTimestamp() <= $endTs) {
                    $insurancePayeeName = $payeeDefs['Car Insurance'][mt_rand(0, count($payeeDefs['Car Insurance']) - 1)];
                    $this->insertTransaction(
                        $db,
                        $userId,
                        $checkingId,
                        $categories[$userId]['Car Insurance'],
                        'expense',
                        145.00,
                        $day15->format('Y-m-d'),
                        $payees[$insurancePayeeName],
                        'Monthly car insurance'
                    );
                    $totalCreated++;
                }

                // ------ Daily expense transactions across the date range ------
                // Walk day-by-day and probabilistically add expense transactions
                $cursor = clone $range['start'];
                while ($cursor->getTimestamp() <= $endTs) {
                    $dayOfWeek = (int)$cursor->format('N'); // 1=Mon, 7=Sun
                    $dateStr   = $cursor->format('Y-m-d');

                    // Groceries: 2–3 times/week — Mon, Wed, Sat
                    if (in_array($dayOfWeek, [1, 3, 6])) {
                        $amount    = mt_rand(3000, 12000) / 100; // $30–$120
                        $payeeName = $payeeDefs['Groceries'][mt_rand(0, count($payeeDefs['Groceries']) - 1)];
                        $account   = (mt_rand(0, 1) === 0) ? $checkingId : $creditCardId;
                        $this->insertTransaction(
                            $db, $userId, $account, $categories[$userId]['Groceries'],
                            'expense', $amount, $dateStr, $payees[$payeeName], null
                        );
                        $totalCreated++;
                    }

                    // Restaurants: 1–2 times/week — Tue, Fri
                    if (in_array($dayOfWeek, [2, 5])) {
                        $amount    = mt_rand(1500, 8000) / 100; // $15–$80
                        $payeeName = $payeeDefs['Restaurants'][mt_rand(0, count($payeeDefs['Restaurants']) - 1)];
                        $this->insertTransaction(
                            $db, $userId, $creditCardId, $categories[$userId]['Restaurants'],
                            'expense', $amount, $dateStr, $payees[$payeeName], null
                        );
                        $totalCreated++;
                    }

                    // Gas: 2–3 times/week — Mon, Thu, Sat
                    if (in_array($dayOfWeek, [1, 4, 6])) {
                        if (mt_rand(0, 2) > 0) { // ~66% chance on eligible days
                            $amount    = mt_rand(3000, 7000) / 100; // $30–$70
                            $payeeName = $payeeDefs['Gas'][mt_rand(0, count($payeeDefs['Gas']) - 1)];
                            $this->insertTransaction(
                                $db, $userId, $creditCardId, $categories[$userId]['Gas'],
                                'expense', $amount, $dateStr, $payees[$payeeName], null
                            );
                            $totalCreated++;
                        }
                    }

                    // FastTrack: occasional — weekdays
                    if (in_array($dayOfWeek, [1, 2, 3, 4, 5])) {
                        if (mt_rand(0, 4) === 0) { // ~20% chance
                            $amount    = mt_rand(200, 800) / 100; // $2–$8
                            $payeeName = $payeeDefs['FastTrack'][mt_rand(0, count($payeeDefs['FastTrack']) - 1)];
                            $this->insertTransaction(
                                $db, $userId, $checkingId, $categories[$userId]['FastTrack'],
                                'expense', $amount, $dateStr, $payees[$payeeName], 'Toll payment'
                            );
                            $totalCreated++;
                        }
                    }

                    // Entertainment: 1–2 times/week — Thu, Sun
                    if (in_array($dayOfWeek, [4, 7])) {
                        $amount    = mt_rand(1000, 9000) / 100; // $10–$90
                        $payeeName = $payeeDefs['Entertainment'][mt_rand(0, count($payeeDefs['Entertainment']) - 1)];
                        $this->insertTransaction(
                            $db, $userId, $creditCardId, $categories[$userId]['Entertainment'],
                            'expense', $amount, $dateStr, $payees[$payeeName], null
                        );
                        $totalCreated++;
                    }

                    // Shopping: 1–2 times/week — Wed, Sat
                    if (in_array($dayOfWeek, [3, 6])) {
                        $amount    = mt_rand(2500, 15000) / 100; // $25–$150
                        $payeeName = $payeeDefs['Shopping'][mt_rand(0, count($payeeDefs['Shopping']) - 1)];
                        $account   = (mt_rand(0, 1) === 0) ? $checkingId : $creditCardId;
                        $this->insertTransaction(
                            $db, $userId, $account, $categories[$userId]['Shopping'],
                            'expense', $amount, $dateStr, $payees[$payeeName], null
                        );
                        $totalCreated++;
                    }

                    // Health: occasional — ~once per 10 days on Mon
                    if ($dayOfWeek === 1 && mt_rand(0, 2) === 0) {
                        $amount    = mt_rand(2000, 20000) / 100; // $20–$200
                        $payeeName = $payeeDefs['Health'][mt_rand(0, count($payeeDefs['Health']) - 1)];
                        $this->insertTransaction(
                            $db, $userId, $checkingId, $categories[$userId]['Health'],
                            'expense', $amount, $dateStr, $payees[$payeeName], null
                        );
                        $totalCreated++;
                    }

                    // Gifts: occasional — ~once per 2 weeks on Sat
                    if ($dayOfWeek === 6 && mt_rand(0, 3) === 0) {
                        $amount    = mt_rand(2000, 10000) / 100; // $20–$100
                        $payeeName = $payeeDefs['Gifts'][mt_rand(0, count($payeeDefs['Gifts']) - 1)];
                        $this->insertTransaction(
                            $db, $userId, $creditCardId, $categories[$userId]['Gifts'],
                            'expense', $amount, $dateStr, $payees[$payeeName], null
                        );
                        $totalCreated++;
                    }

                    // Service (car): occasional — ~once per month on Wed
                    if ($dayOfWeek === 3 && mt_rand(0, 7) === 0) {
                        $amount    = mt_rand(5000, 30000) / 100; // $50–$300
                        $payeeName = $payeeDefs['Service'][mt_rand(0, count($payeeDefs['Service']) - 1)];
                        $this->insertTransaction(
                            $db, $userId, $creditCardId, $categories[$userId]['Service'],
                            'expense', $amount, $dateStr, $payees[$payeeName], 'Car maintenance'
                        );
                        $totalCreated++;
                    }

                    $cursor->modify('+1 day');
                }
            }
        }

        CLI::write("Created {$totalCreated} transactions.", 'green');

        // ---------------------------------------------------------------
        // Step 7 — Create recurring transactions
        // ---------------------------------------------------------------
        CLI::write('Creating recurring transactions...', 'yellow');

        $recurringDefs = [
            [
                'name'       => 'Monthly Salary',
                'type'       => 'income',
                'amount'     => 4500.00,
                'category'   => 'Salary',
                'account'    => 'Checking Account',
                'payee'      => 'Employer Inc',
                'frequency'  => 'monthly',
                'notes'      => 'Monthly salary deposit',
            ],
            [
                'name'       => 'Rent',
                'type'       => 'expense',
                'amount'     => 1800.00,
                'category'   => 'Rent',
                'account'    => 'Checking Account',
                'payee'      => 'Landlord LLC',
                'frequency'  => 'monthly',
                'notes'      => 'Monthly rent payment',
            ],
            [
                'name'       => 'Phone Bill',
                'type'       => 'expense',
                'amount'     => 85.00,
                'category'   => 'Phone',
                'account'    => 'Credit Card',
                'payee'      => 'AT&T',
                'frequency'  => 'monthly',
                'notes'      => 'Monthly phone bill',
            ],
            [
                'name'       => 'Internet Service',
                'type'       => 'expense',
                'amount'     => 80.00,
                'category'   => 'Internet',
                'account'    => 'Credit Card',
                'payee'      => 'Comcast',
                'frequency'  => 'monthly',
                'notes'      => 'Internet service',
            ],
            [
                'name'       => 'Utilities',
                'type'       => 'expense',
                'amount'     => 165.00,
                'category'   => 'Utilities',
                'account'    => 'Credit Card',
                'payee'      => 'PG&E Electric',
                'frequency'  => 'monthly',
                'notes'      => 'Electricity/Gas bill',
            ],
            [
                'name'       => 'Car Insurance',
                'type'       => 'expense',
                'amount'     => 145.00,
                'category'   => 'Car Insurance',
                'account'    => 'Checking Account',
                'payee'      => 'Geico',
                'frequency'  => 'monthly',
                'notes'      => 'Monthly car insurance',
            ],
            [
                'name'       => 'Netflix Subscription',
                'type'       => 'expense',
                'amount'     => 15.99,
                'category'   => 'Entertainment',
                'account'    => 'Credit Card',
                'payee'      => 'Netflix',
                'frequency'  => 'monthly',
                'notes'      => 'Streaming subscription',
            ],
            [
                'name'       => 'Spotify Premium',
                'type'       => 'expense',
                'amount'     => 9.99,
                'category'   => 'Entertainment',
                'account'    => 'Credit Card',
                'payee'      => 'Spotify',
                'frequency'  => 'monthly',
                'notes'      => 'Music subscription',
            ],
            [
                'name'       => 'Gym Membership',
                'type'       => 'expense',
                'amount'     => 49.99,
                'category'   => 'Health',
                'account'    => 'Checking Account',
                'payee'      => 'Kaiser Clinic',
                'frequency'  => 'monthly',
                'notes'      => 'Monthly gym membership',
            ],
            [
                'name'       => 'Weekly Groceries',
                'type'       => 'expense',
                'amount'     => 150.00,
                'category'   => 'Groceries',
                'account'    => 'Checking Account',
                'payee'      => 'Walmart',
                'frequency'  => 'weekly',
                'notes'      => 'Weekly grocery shopping',
            ],
        ];

        $recurringCreated = 0;
        $nextMonth = (clone $today)->modify('first day of next month');

        foreach ([$user1Id, $user2Id] as $userId) {
            foreach ($recurringDefs as $def) {
                $id = uniqid();
                $db->table('recurring_transactions')->insert([
                    'id'            => $id,
                    'user_id'       => $userId,
                    'name'          => $def['name'],
                    'type'          => $def['type'],
                    'amount'        => $def['amount'],
                    'account_id'    => $accounts[$userId][$def['account']],
                    'category_id'   => $categories[$userId][$def['category']],
                    'payee_name'    => $def['payee'],
                    'notes'         => $def['notes'],
                    'frequency'     => $def['frequency'],
                    'start_date'    => $currMonthStart->format('Y-m-d'),
                    'end_date'      => null,
                    'next_due_date' => $nextMonth->format('Y-m-d'),
                    'is_active'     => 1,
                    'auto_create'   => 1,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                ]);
                $recurringCreated++;
            }
        }

        CLI::write("Created {$recurringCreated} recurring transactions.", 'green');
        CLI::write('Done!', 'green');
    }

    /**
     * Insert a single transaction row directly via the query builder.
     */
    private function insertTransaction(
        \CodeIgniter\Database\BaseConnection $db,
        string $userId,
        string $accountId,
        string $categoryId,
        string $type,
        float $amount,
        string $date,
        ?string $payeeId,
        ?string $notes
    ): void {
        $now = date('Y-m-d H:i:s');

        $db->table('transactions')->insert([
            'id'          => uniqid(),
            'user_id'     => $userId,
            'account_id'  => $accountId,
            'category_id' => $categoryId,
            'payee_id'    => $payeeId,
            'amount'      => $amount,
            'type'        => $type,
            'date'        => $date,
            'notes'       => $notes,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);
    }
}
