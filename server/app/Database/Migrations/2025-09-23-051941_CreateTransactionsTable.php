<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateTransactionsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'VARCHAR',
                'constraint'     => 15
            ],
            'account_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15
            ],
            'group_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
            ],
            'category_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
            ],
            'payee_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
            ],
            'amount' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
            ],
            'date' => [
                'type' => 'DATE',
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'is_recurring' => [
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'notes' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'tags' => [
                'type' => 'JSON',
                'null' => true,
            ],
            'ai_categorized' => [
                'type'    => 'BOOLEAN',
                'default' => false,
            ],
            'created_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
            'updated_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addForeignKey('account_id', 'accounts', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('group_id', 'groups', 'id', 'SET NULL', 'SET NULL', 'transactions_group_id_foreign');
        $this->forge->addForeignKey('category_id', 'categories', 'id', 'SET NULL', 'SET NULL');
        $this->forge->addForeignKey('payee_id', 'payees', 'id', 'SET NULL', 'SET NULL');
        $this->forge->addKey('account_id');
        $this->forge->addKey('date');
        $this->forge->createTable('transactions', true);
    }

    public function down()
    {
        $this->forge->dropTable('transactions', true);
    }
}