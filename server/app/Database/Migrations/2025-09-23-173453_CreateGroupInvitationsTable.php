<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateGroupInvitationsTable extends Migration
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
            'invited_user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15
            ],
            'inviter_user_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['pending', 'accepted', 'declined'],
                'default'    => 'pending',
            ],
            'token' => [
                'type'       => 'VARCHAR',
                'constraint' => '255',
                'unique'     => true,
            ],
            'expires_at' => [
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
        $this->forge->addForeignKey('group_id', 'groups', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('invited_user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->addForeignKey('inviter_user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('group_invitations', true);
    }

    public function down()
    {
        $this->forge->dropTable('group_invitations', true);
    }
}