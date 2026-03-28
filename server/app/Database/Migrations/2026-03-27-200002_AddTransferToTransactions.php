<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddTransferToTransactions extends Migration
{
    public function up(): void
    {
        // Extend the type ENUM to include 'transfer'
        $this->db->query("ALTER TABLE transactions MODIFY COLUMN type ENUM('income', 'expense', 'transfer') NOT NULL DEFAULT 'expense'");

        // Add to_account_id column (destination account for transfers)
        $this->forge->addColumn('transactions', [
            'to_account_id' => [
                'type'       => 'VARCHAR',
                'constraint' => 15,
                'null'       => true,
                'default'    => null,
                'after'      => 'account_id',
            ],
        ]);

        // Add FK constraint
        $this->db->query(
            'ALTER TABLE transactions ADD CONSTRAINT fk_transactions_to_account'
            . ' FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL ON UPDATE CASCADE'
        );

        // Add index for faster lookups
        $this->db->query('CREATE INDEX idx_to_account_id ON transactions(to_account_id)');
    }

    public function down(): void
    {
        $this->db->query('DROP INDEX idx_to_account_id ON transactions');
        $this->forge->dropForeignKey('transactions', 'fk_transactions_to_account');
        $this->forge->dropColumn('transactions', 'to_account_id');
        $this->db->query("ALTER TABLE transactions MODIFY COLUMN type ENUM('income', 'expense') NOT NULL DEFAULT 'expense'");
    }
}
