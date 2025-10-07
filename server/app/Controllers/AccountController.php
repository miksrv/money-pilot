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

        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }
    }

    /**
     * GET /accounts - List all accounts for the authenticated user
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $accounts = $this->model->findByUserId($this->authLibrary->user->id);
        return $this->respond($accounts);
    }

    /**
     * POST /accounts - Create a new account
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            $this->model->insert([
                'name'        => $input['name'],
                'type'        => $input['type'],
                'user_id'     => $this->authLibrary->user->id,
                'institution' => $input['name'] ?? null,
                'balance'     => $input['balance'] ?? 0,
            ]);

            return $this->respondCreated();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
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
        $account = $this->model->getById($id, $this->authLibrary->user->id);

        if (!$account) {
            return $this->failNotFound();
        }

        return $this->respond($account);
    }

    /**
     * PUT /accounts/{id} - Update an account
     * @param $id
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

    // DELETE /accounts/{id} - Delete an account
    public function delete($id = null)
    {
        $account = $this->model->getById($id, $this->authLibrary->user->id);

        if (!$account) {
            return $this->failNotFound();
        }

        try {
            if (!$this->model->deleteById($id, $this->authLibrary->user->id)) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete account']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}