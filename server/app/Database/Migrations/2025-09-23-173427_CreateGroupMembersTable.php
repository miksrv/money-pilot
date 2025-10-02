<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateGroupMembersTable extends Migration
{
    public function up()
    {
        $this->forge->addField([
            'id' => [
                'type'           => 'VARCHAR',
                'constraint'     => 15
            ],
            'group_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15
            ],
            'user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15
            ],
            'role' => [
                'type'       => 'ENUM',
                'constraint' => ['owner', 'editor', 'viewer'],
                'default'    => 'viewer',
            ],
            'joined_at' => [
                'type' => 'TIMESTAMP',
                'null' => true,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addForeignKey('group_id', 'groups', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addUniqueKey(['group_id', 'user_id']); // Избежать дубликатов участников
        $this->forge->createTable('group_members', true);
    }

    public function down()
    {
        $this->forge->dropTable('group_members', true);
    }
}