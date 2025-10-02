<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class TransactionController extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\TransactionModel';
    protected $format = 'json';

    public function __construct()
    {
        $this->model = new $this->modelName();
    }

    // GET /api/transactions - Получить транзакции
    public function index()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $limit = $this->request->getGet('limit') ?? 5;
        $transactions = $this->model->where('user_id', $userId)->limit($limit)->findAll();
        return $this->respond($transactions);
    }

    // POST /api/transactions - Создать транзакцию
    public function create()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        $data['user_id'] = $userId;

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        // Обновить баланс аккаунта
        $this->updateAccountBalance($data['account_id'], $data['amount']);

        $transaction = $this->model->find($data['id']);
        return $this->respondCreated($transaction);
    }

    // GET /api/transactions/{id} - Получить транзакцию по ID
    public function show($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $transaction = $this->model->where(['id' => $id, 'user_id' => $userId])->first();
        if (!$transaction) {
            return $this->failNotFound('Transaction not found');
        }

        return $this->respond($transaction);
    }

    // PUT /api/transactions/{id} - Обновить транзакцию
    public function update($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        unset($data['id'], $data['user_id']);

        // Обновить баланс перед обновлением
        $oldTransaction = $this->model->find($id);
        if ($oldTransaction) {
            $this->updateAccountBalance($oldTransaction->account_id, -$oldTransaction->amount);
        }

        if (!$this->model->update($id, $data, ['user_id' => $userId])) {
            return $this->fail($this->model->errors());
        }

        $transaction = $this->model->find($id);
        if ($transaction) {
            $this->updateAccountBalance($transaction->account_id, $transaction->amount);
        }

        return $this->respondUpdated($transaction);
    }

    // DELETE /api/transactions/{id} - Удалить транзакцию
    public function delete($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $transaction = $this->model->where(['id' => $id, 'user_id' => $userId])->first();
        if (!$transaction) {
            return $this->failNotFound('Transaction not found');
        }

        $this->updateAccountBalance($transaction->account_id, -$transaction->amount);

        if (!$this->model->delete($id)) {
            return $this->fail('Failed to delete transaction');
        }

        return $this->respondDeleted(['message' => 'Transaction deleted successfully']);
    }

    private function updateAccountBalance(string $accountId, float $amount): void
    {
        $accountModel = new AccountModel();
        $account = $accountModel->find($accountId);
        if ($account) {
            $accountModel->update($accountId, ['balance' => $account->balance + $amount]);
        }
    }
}