<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\GroupMemberModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class DashboardController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;
    protected \CodeIgniter\Database\BaseConnection $db;

    public function __construct()
    {
        $this->authLibrary = new Auth();
        $this->db          = db_connect();
    }

    /**
     * GET /dashboard/summary - Return financial overview for the authenticated user
     * @return ResponseInterface
     */
    public function summary(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $currentUserId = $this->authLibrary->user->id;
        $groupId       = $this->request->getGet('group_id');
        $ownerId       = null;

        if ($groupId) {
            $groupMemberModel = new GroupMemberModel();
            $membership = $groupMemberModel
                ->where(['group_id' => $groupId, 'user_id' => $currentUserId])
                ->first();

            if (!$membership) {
                return $this->failForbidden('You are not a member of this group');
            }

            $group = $this->db->table('groups')->where('id', $groupId)->get()->getRowObject();

            if (!$group) {
                return $this->failNotFound('Group not found');
            }

            $ownerId = $group->owner_id;
        }

        // userId used only for personal-mode net worth; group mode uses ownerId
        $netWorthUserId = $ownerId ?? $currentUserId;

        // Parse and validate the optional ?month=YYYY-MM query param
        $monthParam = $this->request->getGet('month');
        if ($monthParam && preg_match('/^\d{4}-\d{2}$/', $monthParam)) {
            $requestedMonth = $monthParam;
        } else {
            $requestedMonth = date('Y-m');
        }

        // Net worth: sum of all account balances for the owner (or current user in personal mode)
        $netWorthRow = $this->db->table('accounts')
            ->selectSum('balance')
            ->where('user_id', $netWorthUserId)
            ->get()
            ->getRow();
        $netWorth = (float)($netWorthRow->balance ?? 0);

        // Current month stats
        $currentMonth = $this->getMonthStats($currentUserId, $requestedMonth, $groupId, $ownerId);

        // Previous month stats
        $previousMonthStr = date('Y-m', strtotime($requestedMonth . '-01 -1 month'));
        $previousMonth    = $this->getMonthStats($currentUserId, $previousMonthStr, $groupId, $ownerId);

        // Monthly history: 6 entries ending at the requested month (oldest first)
        $monthlyHistory = [];
        for ($i = 5; $i >= 0; $i--) {
            $month      = date('Y-m', strtotime($requestedMonth . '-01 -' . $i . ' months'));
            $stats      = $this->getMonthStats($currentUserId, $month, $groupId, $ownerId);
            $monthlyHistory[] = [
                'month'    => $month,
                'income'   => $stats['income'],
                'expenses' => $stats['expenses'],
            ];
        }

        return $this->respond([
            'net_worth'       => $netWorth,
            'current_month'   => $currentMonth,
            'previous_month'  => $previousMonth,
            'monthly_history' => $monthlyHistory,
        ]);
    }

    /**
     * GET /dashboard/monthly-spending - Return cumulative daily spending for current and previous month.
     * @return ResponseInterface
     */
    public function monthlySpending(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $currentUserId = $this->authLibrary->user->id;
        $groupId       = $this->request->getGet('group_id');
        $ownerId       = null;

        if ($groupId) {
            $groupMemberModel = new GroupMemberModel();
            $membership = $groupMemberModel
                ->where(['group_id' => $groupId, 'user_id' => $currentUserId])
                ->first();

            if (!$membership) {
                return $this->failForbidden('You are not a member of this group');
            }

            $group = $this->db->table('groups')->where('id', $groupId)->get()->getRowObject();

            if (!$group) {
                return $this->failNotFound('Group not found');
            }

            $ownerId = $group->owner_id;
        }

        $today            = new \DateTime();
        $currentDay       = (int)$today->format('j');
        $currentMonthStr  = $today->format('Y-m');
        $previousMonthStr = date('Y-m', strtotime($currentMonthStr . '-01 -1 month'));

        $daysInCurrentMonth  = (int)date('t', strtotime($currentMonthStr . '-01'));
        $daysInPreviousMonth = (int)date('t', strtotime($previousMonthStr . '-01'));

        $currentMonthData  = $this->buildCumulativeSeries($currentUserId, $currentMonthStr, $daysInCurrentMonth, $currentDay, $groupId, $ownerId);
        $previousMonthData = $this->buildCumulativeSeries($currentUserId, $previousMonthStr, $daysInPreviousMonth, $daysInPreviousMonth, $groupId, $ownerId);

        $currentMonthToDate = $currentMonthData[$currentDay - 1]['cumulative'];

        $comparatorDay            = min($currentDay, $daysInPreviousMonth);
        $previousMonthSameDay     = $previousMonthData[$comparatorDay - 1]['cumulative'];

        return $this->respond([
            'current_month'              => $currentMonthData,
            'previous_month'             => $previousMonthData,
            'current_day'                => $currentDay,
            'current_month_to_date'      => $currentMonthToDate,
            'previous_month_same_day'    => $previousMonthSameDay,
            'days_in_current_month'      => $daysInCurrentMonth,
            'days_in_previous_month'     => $daysInPreviousMonth,
        ]);
    }

    /**
     * Build an array of cumulative daily spending entries for a given month.
     *
     * Days up to $fillToDay are computed from actual transactions; days after $fillToDay
     * carry forward the last known cumulative value (flat line).
     *
     * @param string      $userId
     * @param string      $month       Format: YYYY-MM
     * @param int         $daysInMonth Total days in the month
     * @param int         $fillToDay   Last day to compute from transactions (inclusive); days beyond carry forward
     * @param string|null $groupId     Optional group ID for group-mode aggregation
     * @param string|null $ownerId     Group owner ID (required when $groupId is set)
     * @return array<int, array{day: int, cumulative: float}>
     */
    private function buildCumulativeSeries(
        string $userId,
        string $month,
        int $daysInMonth,
        int $fillToDay,
        ?string $groupId = null,
        ?string $ownerId = null
    ): array {
        $startDate = $month . '-01';
        $endDate   = $month . '-' . str_pad((string)$fillToDay, 2, '0', STR_PAD_LEFT);

        // Fetch daily expense totals within the date range
        $query = $this->db->table('transactions')
            ->select('DAY(date) AS day, SUM(ABS(amount)) AS total')
            ->where('type', 'expense')
            ->where('date >=', $startDate)
            ->where('date <=', $endDate);

        if ($groupId && $ownerId) {
            $query->groupStart()
                ->where('group_id', $groupId)
                ->orGroupStart()
                    ->where('user_id', $ownerId)
                    ->where('group_id IS NULL')
                ->groupEnd()
            ->groupEnd();
        } else {
            $query->where('user_id', $userId)
                  ->where('group_id IS NULL');
        }

        $rows = $query
            ->groupBy('DAY(date)')
            ->orderBy('DAY(date)', 'ASC')
            ->get()
            ->getResultArray();

        // Index daily totals by day number for O(1) lookup
        $dailyTotals = [];
        foreach ($rows as $row) {
            $dailyTotals[(int)$row['day']] = (float)$row['total'];
        }

        $series     = [];
        $cumulative = 0.0;

        for ($day = 1; $day <= $daysInMonth; $day++) {
            if ($day <= $fillToDay) {
                $cumulative += $dailyTotals[$day] ?? 0.0;
            }
            // Days beyond $fillToDay carry the last cumulative value (flat line)
            $series[] = [
                'day'        => $day,
                'cumulative' => round($cumulative, 2),
            ];
        }

        return $series;
    }

    /**
     * Fetch income, expenses, and savings_rate for a given YYYY-MM month string.
     *
     * @param string      $userId
     * @param string      $month    Format: YYYY-MM
     * @param string|null $groupId  Optional group ID for group-mode aggregation
     * @param string|null $ownerId  Group owner ID (required when $groupId is set)
     * @return array{income: float, expenses: float, savings_rate: float}
     */
    private function getMonthStats(
        string $userId,
        string $month,
        ?string $groupId = null,
        ?string $ownerId = null
    ): array {
        $startDate = $month . '-01';
        $endDate   = date('Y-m-t', strtotime($startDate));

        $incomeQuery = $this->db->table('transactions')
            ->selectSum('amount')
            ->where('type', 'income')
            ->where('date >=', $startDate)
            ->where('date <=', $endDate);

        if ($groupId && $ownerId) {
            $incomeQuery->groupStart()
                ->where('group_id', $groupId)
                ->orGroupStart()
                    ->where('user_id', $ownerId)
                    ->where('group_id IS NULL')
                ->groupEnd()
            ->groupEnd();
        } else {
            $incomeQuery->where('user_id', $userId)
                        ->where('group_id IS NULL');
        }

        $income = (float)($incomeQuery->get()->getRow()->amount ?? 0);

        $expenseQuery = $this->db->table('transactions')
            ->selectSum('amount')
            ->where('type', 'expense')
            ->where('date >=', $startDate)
            ->where('date <=', $endDate);

        if ($groupId && $ownerId) {
            $expenseQuery->groupStart()
                ->where('group_id', $groupId)
                ->orGroupStart()
                    ->where('user_id', $ownerId)
                    ->where('group_id IS NULL')
                ->groupEnd()
            ->groupEnd();
        } else {
            $expenseQuery->where('user_id', $userId)
                         ->where('group_id IS NULL');
        }

        $expenses = (float)($expenseQuery->get()->getRow()->amount ?? 0);

        $savingsRate = round(($income - $expenses) / max($income, 1) * 100, 2);

        return [
            'income'       => $income,
            'expenses'     => $expenses,
            'savings_rate' => $savingsRate,
        ];
    }
}
