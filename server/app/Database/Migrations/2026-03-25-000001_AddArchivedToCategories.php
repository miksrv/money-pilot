<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddArchivedToCategories extends Migration
{
    public function up()
    {
        $this->forge->addColumn('categories', [
            'archived' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
                'after'      => 'usage_count',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('categories', 'archived');
    }
}
