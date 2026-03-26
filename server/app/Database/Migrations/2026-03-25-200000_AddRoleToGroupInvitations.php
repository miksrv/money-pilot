<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRoleToGroupInvitations extends Migration
{
    public function up(): void
    {
        $this->db->query(
            "ALTER TABLE group_invitations ADD COLUMN role ENUM('member','viewer') NOT NULL DEFAULT 'member' AFTER status"
        );
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE group_invitations DROP COLUMN role');
    }
}
