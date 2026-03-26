<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\PayeeModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class PayeeController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->authLibrary = new Auth();
        $this->model       = new PayeeModel();
    }

    /**
     * GET /payees — List all payees with usage_count and last_used, sorted by usage DESC.
     * Supports ?search= and ?limit= query params.
     */
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $search = $this->request->getGet('search');
        $limit  = (int)($this->request->getGet('limit') ?? 100);
        $limit  = min(500, max(1, $limit));

        $db = db_connect();

        $builder = $db->table('payees p')
            ->select('p.id, p.name, p.usage_count, MAX(t.date) AS last_used')
            ->join('transactions t', 't.payee_id = p.id', 'left')
            ->groupBy('p.id')
            ->orderBy('p.usage_count', 'DESC')
            ->limit($limit);

        if ($search) {
            $builder->like('p.name', $search);
        }

        $rows = $builder->get()->getResultArray();

        $payees = array_map(function (array $row) {
            return [
                'id'          => $row['id'],
                'name'        => $row['name'],
                'usage_count' => (int)$row['usage_count'],
                'last_used'   => $row['last_used'],
            ];
        }, $rows);

        return $this->respond($payees);
    }

    /**
     * POST /payees — Create a new payee.
     */
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $data   = $this->request->getJSON(true);

        $data['created_by_user_id'] = $userId;
        $data['is_approved']        = true;
        $data['usage_count']        = 0;

        if ($this->model->where('name', $data['name'])->first()) {
            return $this->failValidationErrors('Payee name already exists');
        }

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        $payee = $this->model->find($this->model->getInsertID());

        return $this->respondCreated($payee);
    }

    /**
     * GET /payees/{id} — Get a single payee.
     */
    public function show($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $payee = $this->model->find($id);
        if (!$payee) {
            return $this->failNotFound('Payee not found');
        }

        return $this->respond($payee);
    }

    /**
     * PUT /payees/{id} — Update a payee.
     */
    public function update($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $data = $this->request->getJSON(true);
        unset($data['id'], $data['created_by_user_id']);

        if (!$this->model->update($id, $data)) {
            return $this->fail($this->model->errors());
        }

        $payee = $this->model->find($id);

        return $this->respondUpdated($payee);
    }

    /**
     * DELETE /payees/{id} — Delete a payee only if it has no transactions.
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $payee = $this->model->find($id);
        if (!$payee) {
            return $this->failNotFound('Payee not found');
        }

        $usageCount = db_connect()
            ->table('transactions')
            ->where('payee_id', $id)
            ->countAllResults();

        if ($usageCount > 0) {
            return $this->fail(['messages' => ['error' => 'payee_has_transactions']], 422);
        }

        if (!$this->model->delete($id)) {
            return $this->fail('Failed to delete payee');
        }

        return $this->respondDeleted(['message' => 'Payee deleted successfully']);
    }

    /**
     * POST /payees/{id}/merge — Merge source payee into target, reassigning all transactions.
     * Body: { "target_id": "..." }
     * Returns HTTP 204 on success.
     */
    public function merge($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input    = $this->request->getJSON(true);
        $targetId = $input['target_id'] ?? null;

        if (!$targetId) {
            return $this->failValidationErrors('target_id is required');
        }

        $source = $this->model->find($id);
        if (!$source) {
            return $this->failNotFound('Source payee not found');
        }

        $target = $this->model->find($targetId);
        if (!$target) {
            return $this->failNotFound('Target payee not found');
        }

        if ($id === $targetId) {
            return $this->failValidationErrors('Source and target payees must be different');
        }

        $db = db_connect();

        // Reassign all transactions from source to target
        $db->table('transactions')
            ->where('payee_id', $id)
            ->update(['payee_id' => $targetId]);

        // Recalculate target usage_count from the transactions table
        $newCount = $db->table('transactions')
            ->where('payee_id', $targetId)
            ->countAllResults();

        $this->model->update($targetId, ['usage_count' => $newCount]);

        // Delete the source payee
        $this->model->delete($id);

        return $this->respond(null, 204);
    }
}
