<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddCreditFieldsToAccounts extends Migration
{
    public function up(): void
    {
        $this->forge->addColumn('accounts', [
            'payment_due_day' => [
                'type'       => 'TINYINT',
                'constraint' => 3,
                'unsigned'   => true,
                'null'       => true,
                'default'    => null,
                'after'      => 'institution',
            ],
            'payment_reminder' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
                'after'      => 'payment_due_day',
            ],
        ]);
    }

    public function down(): void
    {
        $this->forge->dropColumn('accounts', ['payment_due_day', 'payment_reminder']);
    }
}
