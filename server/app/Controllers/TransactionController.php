<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class TransactionController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->model = new TransactionModel();
        $this->authLibrary = new Auth();
        $this->ensureAuthenticated();
    }

    /**
     * Ensure the user is authenticated
     * @return ResponseInterface|null
     */
    protected function ensureAuthenticated(): ?ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        return null;
    }

    /**
     * GET /transactions - List all transactions for the authenticated user
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $transactions = $this->model->findByUserId($this->authLibrary->user->id);
        $response     = array_map(function ($transactions) {
            return [
                'id'          => $transactions->id,
                'account_id'  => $transactions->account_id,
                'category_id' => $transactions->category_id,
                'payee_id'    => $transactions->type,
                'parent_id'   => $transactions->parent_id,
                'amount'      => $transactions->amount,
                'type'        => $transactions->color,
                'date'        => $transactions->date
            ];
        }, $transactions);
        return $this->respond($response);
    }

    /**
     * POST /transactions - Create a new transaction
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors(['error' => '1001', 'messages' => $this->validator->getErrors()]);
        }

        try {
            $accountModel = new AccountModel();

            $account = $accountModel->getById($input['account_id'], $this->authLibrary->user->id);
            if (!$account) {
                return $this->failNotFound(['error' => '1002', 'messages' => ['account' => 'Account not found']]);
            }

            $amount = (float)$input['amount'];
            $newBalance = $input['type'] === 'income' ? $account[0]->balance + $amount : $account[0]->balance - $amount;

            if ($newBalance < 0 && !$accountModel->where('id', $input['account_id'])->where('type', 'credit')->first()) {
                return $this->fail(['error' => '1004', 'messages' => ['balance' => 'Insufficient funds for non-credit account']]);
            }

            $this->model->insert([
                'user_id'     => $this->authLibrary->user->id,
                'account_id'  => $input['account_id'],
                'category_id' => $input['category_id'] ?? null,
                'payee_id'    => !empty($input['payee_id']) ? $input['payee_id'] : null,
                'amount'      => $input['amount'],
                'type'        => $input['type'],
                'date'        => $input['date'],
                'description' => $input['description'] ?? null,
            ]);

            $accountModel->updateById($input['account_id'], $this->authLibrary->user->id, ['balance' => $newBalance]);

            return $this->respondCreated();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * GET /transactions/{id} - Get a specific transaction by ID
     * @param string|null $id
     * @return ResponseInterface
     */
    public function show($id = null): ResponseInterface
    {
        $transaction = $this->model->getById($id, $this->authLibrary->user->id);

        if (!$transaction) {
            return $this->failNotFound();
        }

        return $this->respond($transaction);
    }

    /**
     * PUT /transactions/{id} - Update a transaction
     * @param string|null $id
     * @return ResponseInterface
     */
    public function update($id = null): ResponseInterface
    {
        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            unset($input['id'], $input['user_id']);

            if (!$this->model->updateById($id, $this->authLibrary->user->id, $input)) {
                return $this->failValidationErrors($this->model->errors());
            }

            return $this->respondUpdated();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * DELETE /transactions/{id} - Delete a transaction
     * @param string|null $id
     * @return ResponseInterface
     */
    public function delete($id = null): ResponseInterface
    {
        $transaction = $this->model->getById($id, $this->authLibrary->user->id);

        if (!$transaction) {
            return $this->failNotFound();
        }

        try {
            if (!$this->model->deleteById($id, $this->authLibrary->user->id)) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete transaction']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}