<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\Validation\Exceptions\ValidationException;
use Config\Services;

class AccountController extends ResourceController
{
    use ResponseTrait;

    protected Auth $authLibrary;
    protected $format = 'json';

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
                return $this->failValidationErrors(['error' => '1001', 'messages' => $this->model->errors()]);
            }

            return $this->respondUpdated();
        } catch (\Exception $e) {
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
            return $this->fail($e->getMessage());
        }
    }

    public function validateRequest($input, array $rules, array $messages = []): bool
    {
        $this->validator = Services::Validation()->setRules($rules);
        // If you replace the $rules array with the name of the group
        if (is_string($rules)) {
            $validation = config('Validation');

            // If the rule wasn't found in the \Config\Validation, we
            // should throw an exception so the developer can find it.
            if (!isset($validation->$rules)) {
                throw ValidationException::forRuleNotFound($rules);
            }

            // If no error message is defined, use the error message in the Config\Validation file
            if (!$messages) {
                $errorName = $rules . '_errors';
                $messages = $validation->$errorName ?? [];
            }

            $rules = $validation->$rules;
        }

        return $this->validator->setRules($rules, $messages)->run($input);
    }
}