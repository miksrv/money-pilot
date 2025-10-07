<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateCategoriesTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'VARCHAR',
                'constraint'     => 15
            ],
            'user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true, // NULL для глобальных категорий
            ],
            'group_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true
            ],
            'name' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
            ],
            'type' => [
                'type' => 'ENUM',
                'constraint' => ['income', 'expense'],
                'default' => 'expense',
            ],
            'parent_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true, // Для подкатегорий
            ],
            'icon' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true, // Для UI (эмодзи или SVG)
            ],
            'color' => [
                'type'       => 'VARCHAR',
                'constraint' => '50',
                'null'       => true, // Для UI (эмодзи или SVG)
            ],
            'budget' => [
                'type'       => 'DECIMAL',
                'constraint' => '15,2',
                'null'       => true,
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
        $this->forge->addForeignKey('group_id', 'groups', 'id', 'SET NULL', 'SET NULL');
        $this->forge->addForeignKey('parent_id', 'categories', 'id', 'CASCADE', 'SET NULL');
        $this->forge->addUniqueKey(['user_id', 'name']); // Уникальность имени в рамках user_id или глобально
        $this->forge->createTable('categories', true);
    }

    public function down()
    {
        $this->forge->dropTable('categories', true);
    }
}