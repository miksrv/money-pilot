<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddIsParentToCategories extends Migration
{
    public function up()
    {
        $this->forge->addColumn('categories', [
            'is_parent' => [
                'type'       => 'TINYINT',
                'constraint' => 1,
                'default'    => 0,
                'after'      => 'parent_id',
            ],
        ]);
    }

    public function down()
    {
        $this->forge->dropColumn('categories', 'is_parent');
    }
}
