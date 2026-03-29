<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddDefaultAccountIdToPayees extends Migration
{
    public function up(): void
    {
        $this->db->query('
            ALTER TABLE `payees`
                ADD COLUMN `default_account_id` VARCHAR(15) NULL AFTER `default_category_id`,
                ADD CONSTRAINT `fk_payees_default_account`
                    FOREIGN KEY (`default_account_id`) REFERENCES `accounts`(`id`)
                    ON DELETE SET NULL
        ');
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE `payees` DROP FOREIGN KEY `fk_payees_default_account`');
        $this->db->query('ALTER TABLE `payees` DROP COLUMN `default_account_id`');
    }
}
