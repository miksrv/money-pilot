<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use App\Models\CategoryModel;
use App\Models\GroupMemberModel;
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
        $groupId       = $this->request->getGet('group_id');
        $userId        = $currentUserId;

        if ($groupId) {
            $groupMemberModel = new GroupMemberModel();
            $membership = $groupMemberModel
                ->where(['group_id' => $groupId, 'user_id' => $currentUserId])
                ->first();

            if (!$membership) {
                return $this->failForbidden('You are not a member of this group');
            }

            $db    = db_connect();
            $group = $db->table('groups')->where('id', $groupId)->get()->getRowObject();

            if (!$group) {
                return $this->failNotFound('Group not found');
            }

            $userId = $group->owner_id;
        }

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
            ->join('payees p', 'p.id = t.payee_id', 'left')
            ->where('t.user_id', $userId);

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
            ->join('payees p', 'p.id = t.payee_id', 'left')
            ->where('t.user_id', $userId);

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
            ->orderBy('t.date', 'DESC')
            ->orderBy('t.updated_at', 'DESC')
            ->limit($limit, $offset)
            ->get()
            ->getResultObject();

        $data = array_map(function ($row) {
            return [
                'id'          => $row->id,
                'account_id'  => $row->account_id,
                'category_id' => $row->category_id,
                'payee'       => $row->payee,
                'amount'      => (float)$row->amount,
                'type'        => $row->type,
                'notes'       => $row->notes,
                'date'        => $row->date,
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

            // Increment usage_count for the selected category
            if (!empty($input['category_id'])) {
                $categoryModel = new CategoryModel();
                $categoryModel->incrementUsageCount($input['category_id']);
            }

            $account = $accountModel->getById($input['account_id'], $this->authLibrary->user->id);

            if (!$account) {
                return $this->failNotFound(['error' => '1002', 'messages' => ['account' => 'Account not found']]);
            }

            $amount     = (float)$input['amount'];
            $newBalance = $input['type'] === 'income' ? $account[0]->balance + $amount : $account[0]->balance - $amount;

            if ($newBalance < 0 && !$accountModel->where('id', $input['account_id'])->where('type', 'credit')->first()) {
                return $this->fail(['error' => '1004', 'messages' => ['balance' => 'Insufficient funds for non-credit account']]);
            }

            // Combine input date with current UTC time
            $dateTime = new \DateTime($input['date'], new \DateTimeZone('UTC'));
            $dateTime->setTime((int)gmdate('H'), (int)gmdate('i'), (int)gmdate('s'));
            $formattedDateTime = $dateTime->format('Y-m-d H:i:s');

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
                'amount'      => $input['amount'],
                'type'        => $input['type'],
                'date'        => $formattedDateTime,
                'notes'       => $input['notes'] ?? null,
            ]);

            $accountModel->updateById($input['account_id'], $this->authLibrary->user->id, ['balance' => $newBalance]);

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

        $transaction = $this->model->getById($id, $this->authLibrary->user->id);

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

        try {
            // Remove fields that shouldn't be updated directly
            unset($input['id'], $input['user_id']);

            // Filter to only allowed fields
            $updateData = array_intersect_key($input, array_flip($allowedFields));

            if (empty($updateData)) {
                return $this->failValidationErrors(['error' => 'No valid fields to update']);
            }

            if (!$this->model->updateById($id, $this->authLibrary->user->id, $updateData)) {
                return $this->failValidationErrors($this->model->errors());
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

        $transactions = $this->model->getById($id, $this->authLibrary->user->id);

        if (empty($transactions)) {
            return $this->failNotFound();
        }

        try {
            $transaction  = $transactions[0];
            $accountModel = new AccountModel();
            $account      = $accountModel->getById($transaction->account_id, $this->authLibrary->user->id);

            if (!empty($account)) {
                $currentBalance = (float)$account[0]->balance;
                // Reverse: if expense was deducted, add it back; if income was added, subtract it
                $newBalance = $transaction->type === 'expense'
                    ? $currentBalance + (float)$transaction->amount
                    : $currentBalance - (float)$transaction->amount;
                $accountModel->updateById($transaction->account_id, $this->authLibrary->user->id, ['balance' => $newBalance]);
            }

            if (!$this->model->deleteById($id, $this->authLibrary->user->id)) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete transaction']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}
