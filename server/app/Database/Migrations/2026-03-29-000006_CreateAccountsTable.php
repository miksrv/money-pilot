<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateAccountsTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
            ],
            'user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
            ],
            'type' => [
                'type'       => 'ENUM',
                'constraint' => ['checking', 'savings', 'credit', 'investment'],
                'default'    => 'checking',
            ],
            'balance' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'default'    => '0.00',
            ],
            'institution' => [
                'type'       => 'VARCHAR',
                'constraint' => 100,
                'null'       => true,
            ],
            'payment_due_day' => [
                'type'       => 'TINYINT',
                'constraint' => 3,
                'unsigned'   => true,
                'null'       => true,
                'default'    => null,
            ],
            'payment_reminder' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
            ],
            'last_synced' => [
                'type' => 'TIMESTAMP',
                'null' => true,
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
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addKey(['user_id', 'name'], false, true);
        $this->forge->createTable('accounts', true);
    }

    public function down()
    {
        $this->forge->dropTable('accounts', true);
    }
}
