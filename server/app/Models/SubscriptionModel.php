<?php

namespace App\Models;

use CodeIgniter\Model;

class SubscriptionModel extends Model
{
    protected $table          = 'subscriptions';
    protected $primaryKey     = 'id';
    protected $allowedFields  = ['id', 'user_id', 'plan', 'status', 'started_at', 'expires_at'];
    protected $useTimestamps  = true;
    protected $useAutoIncrement = false;

    /**
     * Returns true if the user has an active subscription that has not expired.
     */
    public function hasActiveSubscription(string $userId): bool
    {
        $row = $this->db->table('subscriptions')
            ->where('user_id', $userId)
            ->where('status', 'active')
            ->groupStart()
                ->where('expires_at IS NULL')
                ->orWhere('expires_at >', date('Y-m-d H:i:s'))
            ->groupEnd()
            ->get()
            ->getRowObject();

        return $row !== null;
    }
}
