<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use App\Models\CategoryModel;
use App\Models\PayeeModel;
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
    }

    /**
     * GET /transactions - List all transactions for the authenticated user
     * Supports query params: page, limit, search, date_from, date_to, type, account_id, category_id
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $currentUserId = $this->authLibrary->user->id;

        $baseWhere = function ($builder) use ($currentUserId) {
            $builder->where('t.user_id', $currentUserId);
        };

        $page       = max(1, (int)($this->request->getGet('page') ?? 1));
        $limit      = min(100, max(1, (int)($this->request->getGet('limit') ?? 25)));
        $search     = $this->request->getGet('search');
        $dateFrom   = $this->request->getGet('date_from');
        $dateTo     = $this->request->getGet('date_to');
        $type       = $this->request->getGet('type');
        $accountId  = $this->request->getGet('account_id');
        $categoryId = $this->request->getGet('category_id');

        $db = db_connect();

        // Build base builder
        $builder = $db->table('transactions t')
            ->select('t.*, p.name as payee')
            ->join('payees p', 'p.id = t.payee_id', 'left');

        $baseWhere($builder);

        if ($search) {
            $builder->groupStart()
                ->like('p.name', $search)
                ->orLike('t.notes', $search)
            ->groupEnd();
        }
        if ($dateFrom) {
            $builder->where('t.date >=', $dateFrom);
        }
        if ($dateTo) {
            $builder->where('t.date <=', $dateTo);
        }
        if ($type && in_array($type, ['income', 'expense'])) {
            $builder->where('t.type', $type);
        }
        if ($accountId) {
            $builder->where('t.account_id', $accountId);
        }
        if ($categoryId) {
            $builder->where('t.category_id', $categoryId);
        }

        // Build separate count query
        $countBuilder = $db->table('transactions t')
            ->select('COUNT(*) as cnt')
            ->join('payees p', 'p.id = t.payee_id', 'left');

        $baseWhere($countBuilder);

        if ($search) {
            $countBuilder->groupStart()
                ->like('p.name', $search)
                ->orLike('t.notes', $search)
            ->groupEnd();
        }
        if ($dateFrom) {
            $countBuilder->where('t.date >=', $dateFrom);
        }
        if ($dateTo) {
            $countBuilder->where('t.date <=', $dateTo);
        }
        if ($type && in_array($type, ['income', 'expense'])) {
            $countBuilder->where('t.type', $type);
        }
        if ($accountId) {
            $countBuilder->where('t.account_id', $accountId);
        }
        if ($categoryId) {
            $countBuilder->where('t.category_id', $categoryId);
        }

        $total  = (int)($countBuilder->get()->getRow()->cnt ?? 0);
        $pages  = $total > 0 ? (int)ceil($total / $limit) : 1;
        $offset = ($page - 1) * $limit;

        $rows = $builder
            ->orderBy('t.created_at', 'DESC')
            ->orderBy('t.date', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultObject();

        $data = array_map(function ($row) {
            return [
                'id'             => $row->id,
                'account_id'     => $row->account_id,
                'to_account_id'  => $row->to_account_id ?? null,
                'category_id'    => $row->category_id,
                'payee'          => $row->payee,
                'amount'         => (float)$row->amount,
                'type'           => $row->type,
                'notes'          => $row->notes,
                'date'           => $row->date,
                'created_at'     => $row->created_at,
            ];
        }, $rows);

        return $this->respond([
            'data' => $data,
            'meta' => [
                'total' => $total,
                'page'  => $page,
                'limit' => $limit,
                'pages' => $pages,
            ],
        ]);
    }

    /**
     * POST /transactions - Create a new transaction
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors(['error' => '1001', 'messages' => $this->validator->getErrors()]);
        }

        try {
            $accountModel = new AccountModel();
            $payeeModel   = new PayeeModel();

            $account = $accountModel->getById($input['account_id'], $this->authLibrary->user->id);

            if (!$account) {
                return $this->failNotFound(['error' => '1002', 'messages' => ['account' => 'Account not found']]);
            }

            // Combine input date with current UTC time
            $dateTime = new \DateTime($input['date'], new \DateTimeZone('UTC'));
            $dateTime->setTime((int)gmdate('H'), (int)gmdate('i'), (int)gmdate('s'));
            $formattedDateTime = $dateTime->format('Y-m-d H:i:s');

            $amount = (float)$input['amount'];

            // --- Transfer flow ---
            if ($input['type'] === 'transfer') {
                if (empty($input['to_account_id'])) {
                    return $this->failValidationErrors(['to_account_id' => 'to_account_id is required for transfers']);
                }

                if ($input['to_account_id'] === $input['account_id']) {
                    return $this->failValidationErrors(['to_account_id' => 'Source and destination accounts must be different']);
                }

                if ($amount <= 0) {
                    return $this->failValidationErrors(['amount' => 'Transfer amount must be greater than zero']);
                }

                $destAccount = $accountModel->getById($input['to_account_id'], $this->authLibrary->user->id);
                if (!$destAccount) {
                    return $this->failNotFound(['error' => '1005', 'messages' => ['to_account_id' => 'Destination account not found']]);
                }

                $this->model->insert([
                    'user_id'        => $this->authLibrary->user->id,
                    'account_id'     => $input['account_id'],
                    'to_account_id'  => $input['to_account_id'],
                    'category_id'    => null,
                    'payee_id'       => null,
                    'amount'         => $amount,
                    'type'           => 'transfer',
                    'date'           => $formattedDateTime,
                    'notes'          => $input['notes'] ?? null,
                ]);

                $accountModel->updateById($input['account_id'], $this->authLibrary->user->id, [
                    'balance' => $account[0]->balance - $amount,
                ]);

                $accountModel->updateById($input['to_account_id'], $this->authLibrary->user->id, [
                    'balance' => $destAccount[0]->balance + $amount,
                ]);

                return $this->respondCreated();
            }

            // --- Income / Expense flow ---
            $newBalance = $input['type'] === 'income' ? $account[0]->balance + $amount : $account[0]->balance - $amount;

            if ($newBalance < 0 && !$accountModel->where('id', $input['account_id'])->where('type', 'credit')->first()) {
                return $this->fail(['error' => '1004', 'messages' => ['balance' => 'Insufficient funds for non-credit account']]);
            }

            // Increment usage_count for the selected category
            if (!empty($input['category_id'])) {
                $categoryModel = new CategoryModel();
                $categoryModel->incrementUsageCount($input['category_id']);
            }

            if ($input['payee']) {
                // Ensure payee exists or create a new one
                $payeeId = $payeeModel->getOrCreateByName($input['payee'], $this->authLibrary->user->id);
            } else {
                $payeeId = null;
            }

            $this->model->insert([
                'user_id'     => $this->authLibrary->user->id,
                'account_id'  => $input['account_id'],
                'category_id' => $input['category_id'] ?? null,
                'payee_id'    => $payeeId,
                'amount'      => $amount,
                'type'        => $input['type'],
                'date'        => $formattedDateTime,
                'notes'       => $input['notes'] ?? null,
            ]);

            $accountModel->updateById($input['account_id'], $this->authLibrary->user->id, ['balance' => $newBalance]);

            // Smart categorization: persist the chosen category and account as the payee's defaults
            if ($payeeId && !empty($input['category_id'])) {
                $updatePayload = ['default_category_id' => $input['category_id']];
                if (!empty($input['account_id'])) {
                    $updatePayload['default_account_id'] = $input['account_id'];
                }
                $payeeModel->update($payeeId, $updatePayload);
            }

            return $this->respondCreated();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
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
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $transaction = $this->resolveAccessibleTransaction($id);

        if (!$transaction) {
            return $this->failNotFound();
        }

        return $this->respond($transaction);
    }

    /**
     * PUT /transactions/{id} - Update a transaction (supports partial updates)
     * @param string|null $id
     * @return ResponseInterface
     */
    public function update($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);

        // Build dynamic validation rules based on provided fields
        $updateRules = [];
        $allowedFields = ['account_id', 'category_id', 'amount', 'type', 'date', 'notes', 'payee'];
        
        foreach ($input as $key => $value) {
            if (!in_array($key, $allowedFields) && $key !== 'id') {
                continue;
            }
            
            // Apply validation only for fields that are being updated
            switch ($key) {
                case 'account_id':
                    $updateRules['account_id'] = 'required';
                    break;
                case 'category_id':
                    $updateRules['category_id'] = 'permit_empty';
                    break;
                case 'amount':
                    $updateRules['amount'] = 'required|decimal';
                    break;
                case 'type':
                    $updateRules['type'] = 'required|in_list[income,expense]';
                    break;
                case 'date':
                    $updateRules['date'] = 'required|valid_date';
                    break;
                case 'notes':
                    $updateRules['notes'] = 'permit_empty';
                    break;
            }
        }

        if (!empty($updateRules) && !$this->validateRequest($input, $updateRules, $this->model->validationMessages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        // Verify the current user can access this transaction (own or group member with edit rights)
        $transaction = $this->resolveAccessibleTransaction($id);
        if (!$transaction) {
            return $this->failNotFound();
        }

        if ($transaction->type === 'transfer') {
            return $this->fail('Transfers cannot be edited. Delete and recreate if needed.', 422);
        }

        try {
            // Remove fields that shouldn't be updated directly
            unset($input['id'], $input['user_id']);

            // Filter to only allowed fields
            $updateData = array_intersect_key($input, array_flip($allowedFields));

            if (empty($updateData)) {
                return $this->failValidationErrors(['error' => 'No valid fields to update']);
            }

            // Handle payee name to payee_id conversion
            if (isset($updateData['payee'])) {
                $payeeName = $updateData['payee'];
                unset($updateData['payee']);

                if (!empty($payeeName)) {
                    $payeeModel = new PayeeModel();
                    $updateData['payee_id'] = $payeeModel->getOrCreateByName($payeeName, $this->authLibrary->user->id);
                } else {
                    $updateData['payee_id'] = null;
                }
            }

            $success = $this->model->updateById($id, $this->authLibrary->user->id, $updateData);

            if (!$success) {
                return $this->failValidationErrors($this->model->errors());
            }

            // Smart categorization: persist the chosen category and account as the payee's defaults
            if (isset($updateData['category_id'])) {
                $effectivePayeeId = $updateData['payee_id'] ?? $transaction->payee_id ?? null;
                if ($effectivePayeeId) {
                    $payeeModel = new PayeeModel();
                    $updatePayload = ['default_category_id' => $updateData['category_id']];
                    $effectiveAccountId = $updateData['account_id'] ?? $transaction->account_id ?? null;
                    if (!empty($effectiveAccountId)) {
                        $updatePayload['default_account_id'] = $effectiveAccountId;
                    }
                    $payeeModel->update($effectivePayeeId, $updatePayload);
                }
            }

            return $this->respondUpdated();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * POST /transactions/bulk-delete - Delete multiple transactions by ID
     * Only deletes transactions that belong to the authenticated user.
     * @return ResponseInterface
     */
    public function bulkDelete(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);
        $ids   = $input['ids'] ?? null;

        if (empty($ids) || !is_array($ids)) {
            return $this->failValidationErrors(['ids' => 'ids must be a non-empty array']);
        }

        try {
            $userId  = $this->authLibrary->user->id;
            $deleted = $this->model->bulkDeleteByIds($ids, $userId);

            return $this->respond(['deleted' => $deleted]);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * DELETE /transactions/{id} - Delete a transaction and reverse account balance
     * @param string|null $id
     * @return ResponseInterface
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $transaction = $this->resolveAccessibleTransaction($id);

        if (!$transaction) {
            return $this->failNotFound();
        }

        try {
            $accountModel  = new AccountModel();
            $userId        = $this->authLibrary->user->id;
            $account       = $accountModel->getById($transaction->account_id, $userId);
            $amount        = (float)$transaction->amount;

            if ($transaction->type === 'transfer' && !empty($transaction->to_account_id)) {
                // Reverse transfer: return funds to source, remove from destination
                if (!empty($account)) {
                    $accountModel->updateById(
                        $transaction->account_id,
                        $userId,
                        ['balance' => (float)$account[0]->balance + $amount]
                    );
                }

                $destAccount = $accountModel->getById($transaction->to_account_id, $userId);
                if (!empty($destAccount)) {
                    $accountModel->updateById(
                        $transaction->to_account_id,
                        $userId,
                        ['balance' => (float)$destAccount[0]->balance - $amount]
                    );
                }
            } elseif (!empty($account)) {
                $currentBalance = (float)$account[0]->balance;
                // Reverse: if expense was deducted, add it back; if income was added, subtract it
                $newBalance = $transaction->type === 'expense'
                    ? $currentBalance + $amount
                    : $currentBalance - $amount;
                $accountModel->updateById($transaction->account_id, $userId, ['balance' => $newBalance]);
            }

            $deleted = $this->model->deleteById($id, $userId);

            if (!$deleted) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete transaction']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * Resolve a transaction the current user is authorised to access.
     * Returns the transaction object when the current user owns it; null otherwise.
     */
    private function resolveAccessibleTransaction(?string $id): ?object
    {
        if (empty($id)) {
            return null;
        }

        $own = $this->model->getById($id, $this->authLibrary->user->id);

        return !empty($own) ? $own[0] : null;
    }
}
