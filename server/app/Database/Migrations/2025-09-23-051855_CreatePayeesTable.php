<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreatePayeesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'VARCHAR',
                'constraint'     => 15
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => '100',
                'unique'     => true,
            ],
            'description' => [
                'type' => 'TEXT',
                'null' => true,
            ],
            'created_by_user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
            ],
            'is_approved' => [
                'type'    => 'BOOLEAN',
                'default' => true,
            ],
            'usage_count' => [
                'type'    => 'INT',
                'unsigned' => true,
                'default' => 0,
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
        $this->forge->addForeignKey('created_by_user_id', 'users', 'id', 'SET NULL', 'SET NULL');
        $this->forge->addKey('usage_count'); // Индекс для сортировки по популярности
        $this->forge->createTable('payees', true);
    }

    public function down()
    {
        $this->forge->dropTable('payees', true);
    }
}