<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateUserPayeeSettingsTable extends Migration
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
                'null'       => false,
            ],
            'payee_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => false,
            ],
            'default_category_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
                'default'    => null,
            ],
            'default_account_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
                'default'    => null,
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
        $this->forge->addUniqueKey(['user_id', 'payee_id']);
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('payee_id', 'payees', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('default_category_id', 'categories', 'id', 'SET NULL', 'SET NULL');
        $this->forge->addForeignKey('default_account_id', 'accounts', 'id', 'SET NULL', 'SET NULL');
        $this->forge->createTable('user_payee_settings', true);
    }

    public function down()
    {
        $this->forge->dropTable('user_payee_settings', true);
    }
}
