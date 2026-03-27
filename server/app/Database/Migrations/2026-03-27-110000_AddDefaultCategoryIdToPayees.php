<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDefaultCategoryIdToPayees extends Migration
{
    public function up(): void
    {
        $this->db->query('
            ALTER TABLE `payees`
                ADD COLUMN `default_category_id` VARCHAR(15) NULL AFTER `name`,
                ADD CONSTRAINT `fk_payees_category`
                    FOREIGN KEY (`default_category_id`) REFERENCES `categories`(`id`)
                    ON DELETE SET NULL
        ');
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE `payees` DROP FOREIGN KEY `fk_payees_category`');
        $this->db->query('ALTER TABLE `payees` DROP COLUMN `default_category_id`');
    }
}
