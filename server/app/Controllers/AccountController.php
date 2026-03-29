<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class AccountController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->model       = new AccountModel();
        $this->authLibrary = new Auth();
    }

    /**
     * GET /accounts - List all accounts for the authenticated user.
     * Includes transaction_count per account.
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $currentUserId = $this->authLibrary->user->id;

        $db       = db_connect();
        $accounts = $this->model->findByUserId($currentUserId);

        $response = array_map(function ($account) use ($db) {
            $count = $db->table('transactions')
                ->where('account_id', $account->id)
                ->countAllResults();

            return [
                'id'                => $account->id,
                'name'              => $account->name,
                'type'              => $account->type,
                'balance'           => (float)$account->balance,
                'institution'       => $account->institution,
                'transaction_count' => $count,
                'payment_due_day'   => $account->payment_due_day,
                'payment_reminder'  => (bool)$account->payment_reminder,
            ];
        }, $accounts);

        return $this->respond($response);
    }

    /**
     * POST /accounts - Create a new account
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            $this->model->insert([
                'name'             => $input['name'],
                'type'             => $input['type'],
                'user_id'          => $this->authLibrary->user->id,
                'institution'      => $input['institution'] ?? null,
                'balance'          => $input['balance'] ?? 0,
                'payment_due_day'  => $input['payment_due_day'] ?? null,
                'payment_reminder' => isset($input['payment_reminder']) ? (int)$input['payment_reminder'] : 0,
            ]);

            return $this->respondCreated();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * GET /accounts/{id} - Get a specific account by ID
     * @param $id
     * @return ResponseInterface
     */
    public function show($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $account = $this->model->getById($id, $this->authLibrary->user->id);

        if (!$account) {
            return $this->failNotFound();
        }

        return $this->respond($account);
    }

    /**
     * PUT /accounts/{id} - Update an account and return the updated object
     * @param $id
     * @return ResponseInterface
     */
    public function update($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            unset($input['id'], $input['user_id']);

            if (isset($input['payment_reminder'])) {
                $input['payment_reminder'] = (int)$input['payment_reminder'];
            }

            if (!$this->model->updateById($id, $this->authLibrary->user->id, $input)) {
                return $this->failValidationErrors($this->model->errors());
            }

            $updated = $this->model->getById($id, $this->authLibrary->user->id);

            return $this->respond($updated[0] ?? []);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * DELETE /accounts/{id} - Delete an account (blocked if it has transactions)
     * @param $id
     * @return ResponseInterface
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $account = $this->model->getById($id, $this->authLibrary->user->id);

        if (empty($account)) {
            return $this->failNotFound();
        }

        // Block deletion if account has transactions
        $transactionCount = db_connect()->table('transactions')
            ->where('account_id', $id)
            ->countAllResults();

        if ($transactionCount > 0) {
            return $this->fail(
                ['error' => 'account_has_transactions'],
                422
            );
        }

        try {
            if (!$this->model->deleteById($id, $this->authLibrary->user->id)) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete account']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}
