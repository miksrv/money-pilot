<?php

namespace App\Commands;

use App\Controllers\RecurringController;
use App\Models\RecurringTransactionModel;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ProcessRecurring extends BaseCommand
{
    protected $group       = 'Finance';
    protected $name        = 'recurring:process';
    protected $description = 'Auto-creates transactions for all overdue recurring rules where auto_create = 1.';

    public function run(array $params)
    {
        $recurringModel     = new RecurringTransactionModel();
        $recurringController = new RecurringController();

        // Fetch all active, auto_create rules due today across all users
        $rules = $recurringModel
            ->where('auto_create', 1)
            ->where('is_active', 1)
            ->where('next_due_date <=', date('Y-m-d'))
            ->groupStart()
                ->where('end_date IS NULL', null, false)
                ->orWhere('end_date >=', date('Y-m-d'))
            ->groupEnd()
            ->findAll();

        if (empty($rules)) {
            CLI::write('No recurring rules due today.', 'yellow');
            return;
        }

        $processed = 0;
        $errors    = 0;

        foreach ($rules as $rule) {
            try {
                $recurringController->createTransactionFromRule($rule, $rule['user_id']);

                $nextDue = $recurringModel->getNextDueDate($rule['frequency'], $rule['next_due_date']);
                $recurringModel->update($rule['id'], ['next_due_date' => $nextDue]);

                CLI::write(
                    sprintf(
                        '[OK] Rule "%s" (id: %s) — transaction created, next due: %s',
                        $rule['name'],
                        $rule['id'],
                        $nextDue
                    ),
                    'green'
                );

                $processed++;
            } catch (\Exception $e) {
                CLI::write(
                    sprintf('[ERROR] Rule "%s" (id: %s): %s', $rule['name'], $rule['id'], $e->getMessage()),
                    'red'
                );
                log_message('error', 'recurring:process — rule ' . $rule['id'] . ': ' . $e->getMessage());
                $errors++;
            }
        }

        CLI::write(
            sprintf('Done. Processed: %d, Errors: %d', $processed, $errors),
            $errors > 0 ? 'yellow' : 'green'
        );
    }
}
