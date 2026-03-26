<?php

namespace App\Controllers;

use App\Libraries\Auth;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class ReportsController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->authLibrary = new Auth();
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Return current-month date range defaults and parse GET params.
     * @return array{date_from: string, date_to: string}
     */
    private function getDateRange(): array
    {
        $dateFrom = $this->request->getGet('date_from') ?? date('Y-m-01');
        $dateTo   = $this->request->getGet('date_to')   ?? date('Y-m-t');

        // Basic sanity: ensure date_from <= date_to
        if ($dateFrom > $dateTo) {
            [$dateFrom, $dateTo] = [$dateTo, $dateFrom];
        }

        return ['date_from' => $dateFrom, 'date_to' => $dateTo];
    }

    // -------------------------------------------------------------------------
    // Endpoints
    // -------------------------------------------------------------------------

    /**
     * GET /reports/spending-by-category
     */
    public function spendingByCategory(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId    = $this->authLibrary->user->id;
        $range     = $this->getDateRange();
        $db        = db_connect();

        $rows = $db->table('transactions t')
            ->select('t.category_id, c.name AS category_name, c.icon AS emoji, c.color, SUM(t.amount) AS total, COUNT(*) AS count')
            ->join('categories c', 'c.id = t.category_id', 'left')
            ->where('t.user_id', $userId)
            ->where('t.type', 'expense')
            ->where('t.date >=', $range['date_from'])
            ->where('t.date <=', $range['date_to'])
            ->groupBy('t.category_id')
            ->orderBy('total', 'DESC')
            ->get()
            ->getResultArray();

        $data = array_map(function (array $row) {
            return [
                'category_id'   => $row['category_id'],
                'category_name' => $row['category_name'],
                'emoji'         => $row['emoji'],
                'color'         => $row['color'],
                'total'         => (float)$row['total'],
                'count'         => (int)$row['count'],
            ];
        }, $rows);

        return $this->respond($data);
    }

    /**
     * GET /reports/income-expense
     */
    public function incomeExpense(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $range  = $this->getDateRange();
        $db     = db_connect();

        $rows = $db->table('transactions')
            ->select("DATE_FORMAT(date, '%Y-%m') AS month, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) AS income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS expenses")
            ->where('user_id', $userId)
            ->where('date >=', $range['date_from'])
            ->where('date <=', $range['date_to'])
            ->groupBy('month')
            ->orderBy('month', 'ASC')
            ->get()
            ->getResultArray();

        $data = array_map(function (array $row) {
            $income   = (float)$row['income'];
            $expenses = (float)$row['expenses'];

            return [
                'month'    => $row['month'],
                'income'   => $income,
                'expenses' => $expenses,
                'net'      => $income - $expenses,
            ];
        }, $rows);

        return $this->respond($data);
    }

    /**
     * GET /reports/spending-trend
     */
    public function spendingTrend(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $range  = $this->getDateRange();
        $db     = db_connect();

        $rows = $db->table('transactions')
            ->select('DATE(date) AS date, SUM(amount) AS amount')
            ->where('user_id', $userId)
            ->where('type', 'expense')
            ->where('date >=', $range['date_from'])
            ->where('date <=', $range['date_to'])
            ->groupBy('DATE(date)')
            ->orderBy('date', 'ASC')
            ->get()
            ->getResultArray();

        $cumulative = 0.0;
        $data = array_map(function (array $row) use (&$cumulative) {
            $amount     = (float)$row['amount'];
            $cumulative += $amount;

            return [
                'date'       => $row['date'],
                'amount'     => $amount,
                'cumulative' => round($cumulative, 2),
            ];
        }, $rows);

        return $this->respond($data);
    }

    /**
     * GET /reports/net-worth
     * For each month in the range, compute what the account balance was at month-end.
     * Method: start from current total balance and walk backwards through transactions.
     */
    public function netWorth(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $range  = $this->getDateRange();
        $db     = db_connect();

        // Current total balance across all accounts
        $currentBalance = (float)($db->table('accounts')
            ->selectSum('balance')
            ->where('user_id', $userId)
            ->get()
            ->getRow()
            ->balance ?? 0);

        // Build list of month-end dates from date_from to date_to
        $months = [];
        $cursor = new \DateTime($range['date_from']);
        $end    = new \DateTime($range['date_to']);

        // Align cursor to first day of its month
        $cursor->modify('first day of this month');

        while ($cursor <= $end) {
            // Month-end = last day of current month
            $monthEnd = clone $cursor;
            $monthEnd->modify('last day of this month');

            // Cap at date_to
            if ($monthEnd > $end) {
                $monthEnd = clone $end;
            }

            $months[] = $monthEnd->format('Y-m-d');
            $cursor->modify('+1 month');
        }

        if (empty($months)) {
            return $this->respond([]);
        }

        // For each month-end, figure out what the balance was at that point.
        // We do this by taking the current balance and subtracting/adding back
        // transactions that occurred AFTER each month-end.
        $data = [];

        foreach ($months as $monthEnd) {
            // Sum of income after month-end (was added to balance later — subtract it back)
            $incomeAfter = (float)($db->table('transactions')
                ->selectSum('amount')
                ->where('user_id', $userId)
                ->where('type', 'income')
                ->where('date >', $monthEnd)
                ->get()
                ->getRow()
                ->amount ?? 0);

            // Sum of expenses after month-end (was deducted from balance later — add it back)
            $expensesAfter = (float)($db->table('transactions')
                ->selectSum('amount')
                ->where('user_id', $userId)
                ->where('type', 'expense')
                ->where('date >', $monthEnd)
                ->get()
                ->getRow()
                ->amount ?? 0);

            $netWorthAtMonthEnd = $currentBalance - $incomeAfter + $expensesAfter;

            $data[] = [
                'month'     => substr($monthEnd, 0, 7), // YYYY-MM
                'net_worth' => round($netWorthAtMonthEnd, 2),
            ];
        }

        return $this->respond($data);
    }

    /**
     * GET /reports/top-payees
     */
    public function topPayees(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $range  = $this->getDateRange();
        $db     = db_connect();

        $rows = $db->table('transactions t')
            ->select('p.name AS payee_name, SUM(t.amount) AS total, COUNT(*) AS count')
            ->join('payees p', 'p.id = t.payee_id', 'left')
            ->where('t.user_id', $userId)
            ->where('t.type', 'expense')
            ->where('t.date >=', $range['date_from'])
            ->where('t.date <=', $range['date_to'])
            ->groupBy('t.payee_id')
            ->orderBy('total', 'DESC')
            ->limit(10)
            ->get()
            ->getResultArray();

        $data = array_map(function (array $row) {
            return [
                'payee_name' => $row['payee_name'],
                'total'      => (float)$row['total'],
                'count'      => (int)$row['count'],
            ];
        }, $rows);

        return $this->respond($data);
    }
}
