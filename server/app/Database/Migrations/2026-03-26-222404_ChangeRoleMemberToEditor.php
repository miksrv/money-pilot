<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class ChangeRoleMemberToEditor extends Migration
{
    public function up()
    {
        // Update group_members: change ENUM to include 'editor', then update data, then remove 'member'
        $this->db->query("ALTER TABLE group_members MODIFY COLUMN role ENUM('owner', 'member', 'editor', 'viewer') DEFAULT 'viewer'");
        $this->db->query("UPDATE group_members SET role = 'editor' WHERE role = 'member'");
        $this->db->query("ALTER TABLE group_members MODIFY COLUMN role ENUM('owner', 'editor', 'viewer') DEFAULT 'viewer'");

        // Update group_invitations: change ENUM to include 'editor', then update data, then remove 'member'
        $this->db->query("ALTER TABLE group_invitations MODIFY COLUMN role ENUM('member', 'editor', 'viewer') DEFAULT 'editor'");
        $this->db->query("UPDATE group_invitations SET role = 'editor' WHERE role = 'member'");
        $this->db->query("ALTER TABLE group_invitations MODIFY COLUMN role ENUM('editor', 'viewer') DEFAULT 'editor'");
    }

    public function down()
    {
        // Revert group_members
        $this->db->query("ALTER TABLE group_members MODIFY COLUMN role ENUM('owner', 'member', 'editor', 'viewer') DEFAULT 'viewer'");
        $this->db->query("UPDATE group_members SET role = 'member' WHERE role = 'editor'");
        $this->db->query("ALTER TABLE group_members MODIFY COLUMN role ENUM('owner', 'member', 'viewer') DEFAULT 'viewer'");

        // Revert group_invitations
        $this->db->query("ALTER TABLE group_invitations MODIFY COLUMN role ENUM('member', 'editor', 'viewer') DEFAULT 'member'");
        $this->db->query("UPDATE group_invitations SET role = 'member' WHERE role = 'editor'");
        $this->db->query("ALTER TABLE group_invitations MODIFY COLUMN role ENUM('member', 'viewer') DEFAULT 'member'");
    }
}
