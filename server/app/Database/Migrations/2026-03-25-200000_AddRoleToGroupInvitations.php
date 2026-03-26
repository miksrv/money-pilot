<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddRoleToGroupInvitations extends Migration
{
    public function up(): void
    {
        $this->db->query(
            "ALTER TABLE group_invitations ADD COLUMN role ENUM('editor','viewer') NOT NULL DEFAULT 'editor' AFTER status"
        );
    }

    public function down(): void
    {
        $this->db->query('ALTER TABLE group_invitations DROP COLUMN role');
    }
}
