<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class CreateSubscriptionsTable extends Migration
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
            'plan' => [
                'type'       => 'ENUM',
                'constraint' => ['pro', 'premium'],
                'default'    => 'pro',
            ],
            'status' => [
                'type'       => 'ENUM',
                'constraint' => ['active', 'cancelled', 'expired'],
                'default'    => 'active',
            ],
            'started_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'expires_at' => [
                'type'    => 'DATETIME',
                'null'    => true,
                'default' => null,
            ],
            'created_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
            'updated_at' => [
                'type' => 'DATETIME',
                'null' => false,
            ],
        ]);

        $this->forge->addPrimaryKey('id');
        $this->forge->addUniqueKey('user_id');
        $this->forge->addForeignKey('user_id', 'users', 'id', 'CASCADE', 'CASCADE');
        $this->forge->createTable('subscriptions', true);
    }

    public function down()
    {
        $this->forge->dropTable('subscriptions', true);
    }
}
