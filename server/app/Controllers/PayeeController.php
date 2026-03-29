<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\PayeeModel;
use App\Models\UserPayeeSettingsModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class PayeeController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;
    protected PayeeModel $payeeModel;
    protected UserPayeeSettingsModel $settingsModel;

    public function __construct()
    {
        $this->authLibrary   = new Auth();
        $this->payeeModel    = new PayeeModel();
        $this->settingsModel = new UserPayeeSettingsModel();
    }

    /**
     * GET /payees — List payees visible to the authenticated user.
     * A payee is visible if the user has at least one transaction with it,
     * or has a user_payee_settings row for it.
     * Supports ?search= (LIKE on name) and ?limit= query params.
     */
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $search = $this->request->getGet('search');
        $limit  = (int)($this->request->getGet('limit') ?? 100);
        $limit  = min(500, max(1, $limit));

        $db = db_connect();

        $builder = $db->table('payees p')
            ->select('p.id, p.name,
                      ups.default_category_id,
                      ups.default_account_id,
                      COUNT(DISTINCT t.id) AS usage_count,
                      MAX(t.date) AS last_used')
            ->join('user_payee_settings ups', "ups.payee_id = p.id AND ups.user_id = " . $db->escape($userId), 'left')
            ->join('transactions t', "t.payee_id = p.id AND t.user_id = " . $db->escape($userId), 'left')
            ->where("(ups.user_id = " . $db->escape($userId) . " OR t.user_id = " . $db->escape($userId) . ")")
            ->groupBy('p.id, ups.default_category_id, ups.default_account_id')
            ->orderBy('p.name', 'ASC')
            ->limit($limit);

        if ($search) {
            $builder->like('p.name', $search);
        }

        $rows = $builder->get()->getResultArray();

        $payees = array_map([$this, 'formatPayeeRow'], $rows);

        return $this->respond($payees);
    }

    /**
     * POST /payees — Find or create a global payee, then upsert user settings.
     * Body: { "name": "...", "default_category_id": "...", "default_account_id": "..." }
     */
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $data   = $this->request->getJSON(true) ?? [];

        $name = trim($data['name'] ?? '');
        if ($name === '') {
            return $this->failValidationErrors(['name' => 'Payee name is required.']);
        }
        if (mb_strlen($name) > 100) {
            return $this->failValidationErrors(['name' => 'Payee name cannot exceed 100 characters.']);
        }

        $payeeId = $this->payeeModel->getOrCreateByName($name);

        $settingsPayload = [];
        if (array_key_exists('default_category_id', $data)) {
            $settingsPayload['default_category_id'] = $data['default_category_id'] ?: null;
        }
        if (array_key_exists('default_account_id', $data)) {
            $settingsPayload['default_account_id'] = $data['default_account_id'] ?: null;
        }

        if (!empty($settingsPayload)) {
            $this->settingsModel->upsertForUser($userId, $payeeId, $settingsPayload);
        } else {
            // Ensure a settings row exists so the payee becomes visible to this user
            $this->settingsModel->upsertForUser($userId, $payeeId, [
                'default_category_id' => null,
                'default_account_id'  => null,
            ]);
        }

        return $this->respondCreated($this->getPayeeForUser($payeeId, $userId));
    }

    /**
     * GET /payees/{id} — Get a single payee with the authenticated user's settings.
     */
    public function show($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $result = $this->getPayeeForUser($id, $userId);

        if ($result === null) {
            return $this->failNotFound('Payee not found');
        }

        return $this->respond($result);
    }

    /**
     * PUT /payees/{id} — Update global name and/or per-user settings.
     * Body: { "name": "...", "default_category_id": "...", "default_account_id": "..." }
     */
    public function update($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;
        $data   = $this->request->getJSON(true) ?? [];

        $payee = $this->payeeModel->find($id);
        if (!$payee) {
            return $this->failNotFound('Payee not found');
        }

        // Update global name if provided
        if (!empty($data['name'])) {
            $name = trim($data['name']);
            if (!$this->payeeModel->update($id, ['name' => $name])) {
                return $this->fail($this->payeeModel->errors());
            }
        }

        // Update per-user settings if any settings fields provided
        $settingsPayload = [];
        if (array_key_exists('default_category_id', $data)) {
            $settingsPayload['default_category_id'] = $data['default_category_id'] ?: null;
        }
        if (array_key_exists('default_account_id', $data)) {
            $settingsPayload['default_account_id'] = $data['default_account_id'] ?: null;
        }

        if (!empty($settingsPayload)) {
            $this->settingsModel->upsertForUser($userId, $id, $settingsPayload);
        }

        return $this->respondUpdated($this->getPayeeForUser($id, $userId));
    }

    /**
     * DELETE /payees/{id} — Remove the user's settings row.
     * If no other user has settings or transactions for this payee, the global payee is also deleted.
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        if (!$this->payeeModel->find($id)) {
            return $this->failNotFound('Payee not found');
        }

        $db = db_connect();

        // Remove this user's settings row
        $db->table('user_payee_settings')
            ->where('user_id', $userId)
            ->where('payee_id', $id)
            ->delete();

        // Clean up the global payee if no one references it anymore
        $this->deleteGlobalPayeeIfOrphaned($id);

        return $this->respondDeleted(['message' => 'Payee deleted successfully']);
    }

    /**
     * POST /payees/{id}/merge — Merge source payee into target for the current user.
     * Body: { "target_id": "..." }
     * Returns HTTP 204 on success.
     */
    public function merge($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId   = $this->authLibrary->user->id;
        $input    = $this->request->getJSON(true) ?? [];
        $targetId = $input['target_id'] ?? null;

        if (!$targetId) {
            return $this->failValidationErrors('target_id is required');
        }

        if ($id === $targetId) {
            return $this->failValidationErrors('Source and target payees must be different');
        }

        if (!$this->payeeModel->find($id)) {
            return $this->failNotFound('Source payee not found');
        }

        if (!$this->payeeModel->find($targetId)) {
            return $this->failNotFound('Target payee not found');
        }

        $db = db_connect();

        // Reassign this user's transactions from source to target
        $db->table('transactions')
            ->where('payee_id', $id)
            ->where('user_id', $userId)
            ->update(['payee_id' => $targetId]);

        // Remove this user's settings row for the source payee
        $db->table('user_payee_settings')
            ->where('user_id', $userId)
            ->where('payee_id', $id)
            ->delete();

        // Clean up the global source payee if it is now orphaned
        $this->deleteGlobalPayeeIfOrphaned($id);

        return $this->respond(null, 204);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Fetch a single payee row joined with the given user's settings and usage stats.
     * Returns null when the payee does not exist.
     */
    private function getPayeeForUser(string $payeeId, string $userId): ?array
    {
        $db = db_connect();

        $row = $db->table('payees p')
            ->select('p.id, p.name,
                      ups.default_category_id,
                      ups.default_account_id,
                      COUNT(DISTINCT t.id) AS usage_count,
                      MAX(t.date) AS last_used')
            ->join('user_payee_settings ups', "ups.payee_id = p.id AND ups.user_id = " . $db->escape($userId), 'left')
            ->join('transactions t', "t.payee_id = p.id AND t.user_id = " . $db->escape($userId), 'left')
            ->where('p.id', $payeeId)
            ->groupBy('p.id, ups.default_category_id, ups.default_account_id')
            ->get()
            ->getRowArray();

        if (!$row) {
            return null;
        }

        return $this->formatPayeeRow($row);
    }

    /**
     * Normalise a raw DB row into the canonical payee response shape.
     */
    private function formatPayeeRow(array $row): array
    {
        return [
            'id'                  => $row['id'],
            'name'                => $row['name'],
            'default_category_id' => $row['default_category_id'] ?? null,
            'default_account_id'  => $row['default_account_id'] ?? null,
            'usage_count'         => (int)($row['usage_count'] ?? 0),
            'last_used'           => $row['last_used'] ?? null,
        ];
    }

    /**
     * Delete the global payee record if no transactions and no user_payee_settings
     * reference it anymore.
     */
    private function deleteGlobalPayeeIfOrphaned(string $payeeId): void
    {
        $db = db_connect();

        $txCount = $db->table('transactions')
            ->where('payee_id', $payeeId)
            ->countAllResults();

        $settingsCount = $db->table('user_payee_settings')
            ->where('payee_id', $payeeId)
            ->countAllResults();

        if ($txCount === 0 && $settingsCount === 0) {
            $this->payeeModel->delete($payeeId);
        }
    }
}
