<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use App\Models\PayeeModel;
use App\Models\RecurringTransactionModel;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class RecurringController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->authLibrary = new Auth();
        $this->model       = new RecurringTransactionModel();
    }

    /**
     * GET /recurring — List all recurring rules for the authenticated user.
     */
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        $rules = $this->model
            ->where('user_id', $userId)
            ->orderBy('next_due_date', 'ASC')
            ->findAll();

        return $this->respond($rules);
    }

    /**
     * POST /recurring — Create a new recurring rule.
     */
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $input  = $this->request->getJSON(true);

        $rules = [
            'name'       => 'required|max_length[255]',
            'type'       => 'required|in_list[income,expense]',
            'amount'     => 'required|decimal|greater_than[0]',
            'account_id' => 'required',
            'frequency'  => 'required|in_list[daily,weekly,biweekly,monthly,quarterly,yearly]',
            'start_date' => 'required|valid_date[Y-m-d]',
        ];

        if (!$this->validateRequest($input, $rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = [
            'user_id'      => $userId,
            'name'         => $input['name'],
            'type'         => $input['type'],
            'amount'       => $input['amount'],
            'account_id'   => $input['account_id'],
            'category_id'  => $input['category_id'] ?? null,
            'payee_name'   => $input['payee_name'] ?? null,
            'notes'        => $input['notes'] ?? null,
            'frequency'    => $input['frequency'],
            'start_date'   => $input['start_date'],
            'end_date'     => $input['end_date'] ?? null,
            'next_due_date' => $input['start_date'],
            'is_active'    => $input['is_active'] ?? 1,
            'auto_create'  => $input['auto_create'] ?? 0,
        ];

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        $rule = $this->model->find($this->model->getInsertID());

        return $this->respondCreated($rule);
    }

    /**
     * PUT /recurring/{id} — Update a recurring rule.
     */
    public function update($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        $rule = $this->model->where('id', $id)->where('user_id', $userId)->first();
        if (!$rule) {
            return $this->failNotFound('Recurring rule not found');
        }

        $input = $this->request->getJSON(true);

        $rules = [
            'name'       => 'permit_empty|max_length[255]',
            'type'       => 'permit_empty|in_list[income,expense]',
            'amount'     => 'permit_empty|decimal|greater_than[0]',
            'frequency'  => 'permit_empty|in_list[daily,weekly,biweekly,monthly,quarterly,yearly]',
            'start_date' => 'permit_empty|valid_date[Y-m-d]',
        ];

        if (!$this->validateRequest($input, $rules)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        $data = array_intersect_key($input, array_flip([
            'name', 'type', 'amount', 'account_id', 'category_id',
            'payee_name', 'notes', 'frequency', 'start_date', 'end_date',
            'is_active', 'auto_create',
        ]));

        // Recompute next_due_date if start_date or frequency changed
        $newFrequency  = $data['frequency']  ?? $rule['frequency'];
        $newStartDate  = $data['start_date'] ?? $rule['start_date'];
        $freqChanged   = isset($data['frequency'])  && $data['frequency']  !== $rule['frequency'];
        $startChanged  = isset($data['start_date']) && $data['start_date'] !== $rule['start_date'];

        if ($freqChanged || $startChanged) {
            // next_due_date resets to start_date when start_date changes, otherwise
            // recompute from current next_due_date with new frequency
            if ($startChanged) {
                $data['next_due_date'] = $newStartDate;
            } else {
                $data['next_due_date'] = $this->model->getNextDueDate($newFrequency, $rule['next_due_date']);
            }
        }

        if (!$this->model->update($id, $data)) {
            return $this->fail($this->model->errors());
        }

        $updated = $this->model->find($id);

        return $this->respondUpdated($updated);
    }

    /**
     * DELETE /recurring/{id} — Delete a recurring rule (ownership verified).
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        $rule = $this->model->where('id', $id)->where('user_id', $userId)->first();
        if (!$rule) {
            return $this->failNotFound('Recurring rule not found');
        }

        $this->model->delete($id);

        return $this->respondDeleted(['message' => 'Recurring rule deleted successfully']);
    }

    /**
     * POST /recurring/{id}/generate — Materialise a transaction from the rule and advance next_due_date.
     */
    public function generate($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        $rule = $this->model->where('id', $id)->where('user_id', $userId)->first();
        if (!$rule) {
            return $this->failNotFound('Recurring rule not found');
        }

        try {
            $transaction = $this->createTransactionFromRule($rule, $userId);

            // Advance next_due_date
            $nextDue = $this->model->getNextDueDate($rule['frequency'], $rule['next_due_date']);
            $this->model->update($id, ['next_due_date' => $nextDue]);

            return $this->respondCreated($transaction);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * PATCH /recurring/{id}/toggle — Flip is_active between 0 and 1.
     */
    public function toggle($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        $rule = $this->model->where('id', $id)->where('user_id', $userId)->first();
        if (!$rule) {
            return $this->failNotFound('Recurring rule not found');
        }

        $newActive = $rule['is_active'] ? 0 : 1;
        $this->model->update($id, ['is_active' => $newActive]);

        $updated = $this->model->find($id);

        return $this->respondUpdated($updated);
    }

    /**
     * Shared logic: create a real transaction from a recurring rule.
     * Mirrors TransactionController::create — updates account balance, handles payee.
     *
     * @param array  $rule
     * @param string $userId
     * @return array Created transaction data
     * @throws \Exception
     */
    public function createTransactionFromRule(array $rule, string $userId): array
    {
        $accountModel     = new AccountModel();
        $payeeModel       = new PayeeModel();
        $transactionModel = new TransactionModel();

        $account = $accountModel->getById($rule['account_id'], $userId);
        if (empty($account)) {
            throw new \Exception('Account not found for recurring rule');
        }

        $amount     = (float)$rule['amount'];
        $newBalance = $rule['type'] === 'income'
            ? (float)$account[0]->balance + $amount
            : (float)$account[0]->balance - $amount;

        $payeeId = null;
        if (!empty($rule['payee_name'])) {
            $payeeId = $payeeModel->getOrCreateByName($rule['payee_name'], $userId);
        }

        // Use next_due_date as the transaction date
        $transactionDate = $rule['next_due_date'];

        $transactionData = [
            'user_id'     => $userId,
            'account_id'  => $rule['account_id'],
            'category_id' => $rule['category_id'] ?? null,
            'payee_id'    => $payeeId,
            'amount'      => $rule['amount'],
            'type'        => $rule['type'],
            'date'        => $transactionDate,
            'notes'       => $rule['notes'] ?? null,
        ];

        $transactionModel->insert($transactionData);
        $insertedId = $transactionModel->getInsertID();

        $accountModel->updateById($rule['account_id'], $userId, ['balance' => $newBalance]);

        return array_merge($transactionData, ['id' => $insertedId]);
    }
}
