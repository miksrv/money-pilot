<?php

namespace App\Controllers;

use App\Libraries\Auth;
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

        $userId = $this->authLibrary->user->id;

        // Parse and validate the optional ?month=YYYY-MM query param
        $monthParam = $this->request->getGet('month');
        if ($monthParam && preg_match('/^\d{4}-\d{2}$/', $monthParam)) {
            $requestedMonth = $monthParam;
        } else {
            $requestedMonth = date('Y-m');
        }

        // Net worth: sum of all account balances for this user
        $netWorthRow = $this->db->table('accounts')
            ->selectSum('balance')
            ->where('user_id', $userId)
            ->get()
            ->getRow();
        $netWorth = (float)($netWorthRow->balance ?? 0);

        // Current month stats
        $currentMonth = $this->getMonthStats($userId, $requestedMonth);

        // Previous month stats
        $previousMonthStr = date('Y-m', strtotime($requestedMonth . '-01 -1 month'));
        $previousMonth    = $this->getMonthStats($userId, $previousMonthStr);

        // Monthly history: 6 entries ending at the requested month (oldest first)
        $monthlyHistory = [];
        for ($i = 5; $i >= 0; $i--) {
            $month      = date('Y-m', strtotime($requestedMonth . '-01 -' . $i . ' months'));
            $stats      = $this->getMonthStats($userId, $month);
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
     * Fetch income, expenses, and savings_rate for a given YYYY-MM month string.
     *
     * @param string $userId
     * @param string $month  Format: YYYY-MM
     * @return array{income: float, expenses: float, savings_rate: float}
     */
    private function getMonthStats(string $userId, string $month): array
    {
        $startDate = $month . '-01';
        $endDate   = date('Y-m-t', strtotime($startDate));

        $income = (float)($this->db->table('transactions')
            ->selectSum('amount')
            ->where('user_id', $userId)
            ->where('type', 'income')
            ->where('date >=', $startDate)
            ->where('date <=', $endDate)
            ->get()
            ->getRow()
            ->amount ?? 0);

        $expenses = (float)($this->db->table('transactions')
            ->selectSum('amount')
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('date >=', $startDate)
            ->where('date <=', $endDate)
            ->get()
            ->getRow()
            ->amount ?? 0);

        $savingsRate = round(($income - $expenses) / max($income, 1) * 100, 2);

        return [
            'income'       => $income,
            'expenses'     => $expenses,
            'savings_rate' => $savingsRate,
        ];
    }
}
