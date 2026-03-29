<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateRecurringTransactionsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'       => 'CHAR',
                'constraint' => 15,
            ],
            'user_id' => [
                'type'       => 'CHAR',
                'constraint' => 15,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
            ],
            'type' => [
                'type'       => 'ENUM',
                'constraint' => ['income', 'expense'],
            ],
            'amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '12,2',
            ],
            'account_id' => [
                'type'       => 'CHAR',
                'constraint' => 15,
            ],
            'category_id' => [
                'type'       => 'CHAR',
                'constraint' => 15,
                'null'       => true,
            ],
            'payee_name' => [
                'type'       => 'VARCHAR',
                'constraint' => 255,
                'null'       => true,
            ],
            'notes' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'frequency' => [
                'type'       => 'ENUM',
                'constraint' => ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
                'default'    => 'monthly',
            ],
            'start_date' => [
                'type' => 'DATE',
            ],
            'end_date' => [
                'type' => 'DATE',
                'null' => true,
            ],
            'next_due_date' => [
                'type' => 'DATE',
            ],
            'is_active' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 1,
            ],
            'auto_create' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
            ],
            'created_at' => [
                'type' => 'DATETIME',
            ],
            'updated_at' => [
                'type' => 'DATETIME',
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addKey('user_id');
        $this->forge->addKey('next_due_date');
        $this->forge->createTable('recurring_transactions', true);
    }

    public function down()
    {
        $this->forge->dropTable('recurring_transactions', true);
    }
}
