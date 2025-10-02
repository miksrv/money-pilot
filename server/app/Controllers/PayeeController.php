<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\PayeeModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class PayeeController extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\PayeeModel';
    protected $format = 'json';

    public function __construct()
    {
        $this->model = new $this->modelName();
    }

    // GET /api/payees - Получить payees
    public function index()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $payees = $this->model->findAll();
        return $this->respond($payees);
    }

    // POST /api/payees - Создать payee
    public function create()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        $data['created_by_user_id'] = $userId;
        $data['is_approved'] = true;
        $data['usage_count'] = 0;

        // Проверить уникальность name
        if ($this->model->where('name', $data['name'])->first()) {
            return $this->failValidationErrors('Payee name already exists');
        }

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        $payee = $this->model->find($data['id']);
        return $this->respondCreated($payee);
    }

    // GET /api/payees/{id} - Получить payee по ID
    public function show($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $payee = $this->model->find($id);
        if (!$payee) {
            return $this->failNotFound('Payee not found');
        }

        return $this->respond($payee);
    }

    // PUT /api/payees/{id} - Обновить payee
    public function update($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        unset($data['id'], $data['created_by_user_id']);

        if (!$this->model->update($id, $data)) {
            return $this->fail($this->model->errors());
        }

        $payee = $this->model->find($id);
        return $this->respondUpdated($payee);
    }

    // DELETE /api/payees/{id} - Удалить payee
    public function delete($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        if (!$this->model->delete($id)) {
            return $this->fail('Failed to delete payee');
        }

        return $this->respondDeleted(['message' => 'Payee deleted successfully']);
    }
}