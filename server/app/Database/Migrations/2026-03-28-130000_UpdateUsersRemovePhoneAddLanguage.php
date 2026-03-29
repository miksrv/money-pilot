<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class UpdateUsersRemovePhoneAddLanguage extends Migration
{
    public function up()
    {
        $this->db->query('ALTER TABLE `users` DROP COLUMN `phone`');
        $this->db->query("ALTER TABLE `users` ADD COLUMN `language` VARCHAR(10) NULL DEFAULT NULL AFTER `name`");
    }

    public function down()
    {
        $this->db->query('ALTER TABLE `users` DROP COLUMN `language`');
        $this->db->query('ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL AFTER `name`');
    }
}
