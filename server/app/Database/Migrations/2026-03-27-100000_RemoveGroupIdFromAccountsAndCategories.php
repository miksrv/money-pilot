<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;

class RemoveGroupIdFromAccountsAndCategories extends Migration
{
    public function up(): void
    {
        $this->forge->dropForeignKey('accounts', 'accounts_group_id_foreign');
        $this->forge->dropColumn('accounts', 'group_id');

        $this->forge->dropForeignKey('categories', 'categories_group_id_foreign');
        $this->forge->dropColumn('categories', 'group_id');
    }

    public function down(): void
    {
        $this->forge->addColumn('accounts', [
            'group_id' => ['type' => 'VARCHAR', 'constraint' => 15, 'null' => true, 'default' => null, 'after' => 'user_id'],
        ]);
        $this->forge->addColumn('categories', [
            'group_id' => ['type' => 'VARCHAR', 'constraint' => 15, 'null' => true, 'default' => null, 'after' => 'user_id'],
        ]);
    }
}
