<?php

namespace App\Models;

class RecurringTransactionModel extends ApplicationBaseModel
{
    protected $table      = 'recurring_transactions';
    protected $primaryKey = 'id';

    protected $returnType       = 'array';
    protected $useSoftDeletes   = false;
    protected $useAutoIncrement = false;
    protected $protectFields    = true;

    protected $allowedFields = [
        'user_id',
        'name',
        'type',
        'amount',
        'account_id',
        'category_id',
        'payee_name',
        'notes',
        'frequency',
        'start_date',
        'end_date',
        'next_due_date',
        'is_active',
        'auto_create',
    ];

    protected $useTimestamps = true;
    protected $createdField  = 'created_at';
    protected $updatedField  = 'updated_at';
    protected $dateFormat    = 'datetime';

    protected $allowCallbacks = true;
    protected $beforeInsert   = ['generateId'];

    /**
     * Compute the next due date after $from for the given frequency.
     */
    public function getNextDueDate(string $frequency, string $from): string
    {
        $date = new \DateTime($from);

        switch ($frequency) {
            case 'daily':
                $date->modify('+1 day');
                break;
            case 'weekly':
                $date->modify('+7 days');
                break;
            case 'biweekly':
                $date->modify('+14 days');
                break;
            case 'monthly':
                $date->modify('+1 month');
                break;
            case 'quarterly':
                $date->modify('+3 months');
                break;
            case 'yearly':
                $date->modify('+1 year');
                break;
        }

        return $date->format('Y-m-d');
    }

    /**
     * Return all active rules due today or overdue for a given user.
     */
    public function getDueToday(string $userId): array
    {
        return $this->where('user_id', $userId)
            ->where('is_active', 1)
            ->where('next_due_date <=', date('Y-m-d'))
            ->groupStart()
                ->where('end_date IS NULL', null, false)
                ->orWhere('end_date >=', date('Y-m-d'))
            ->groupEnd()
            ->findAll();
    }
}
