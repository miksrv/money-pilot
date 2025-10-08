<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\CategoryModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class CategoryController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->model = new CategoryModel();
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
     * GET /categories - List all categories for the authenticated user
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        $categories = $this->model->findByUserId($this->authLibrary->user->id);
        return $this->respond($categories);
    }

    /**
     * POST /categories - Create a new category
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->model->validationRules, $this->model->validationMessages)) {
            return $this->failValidationErrors(['error' => '1001', 'messages' => $this->validator->getErrors()]);
        }

        try {
            $this->model->insert([
                'user_id'   => $this->authLibrary->user->id,
                'name'      => $input['name'],
                'type'      => $input['type'] ?? null,
                'icon'      => $input['icon'] ?? null,
                'color'     => $input['color'] ?? null,
                'budget'    => $input['budget'] ?? null,
                'parent_id' => !empty($input['parent_id']) ? $input['parent_id'] : null,
            ]);

            if ($this->model->errors()) {
                return $this->failValidationErrors($this->model->errors());
            }

            return $this->respondCreated();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * GET /categories/{id} - Get a specific category by ID
     * @param $id
     * @return ResponseInterface
     */
    public function show($id = null): ResponseInterface
    {
        $category = $this->model->getById($id);

        if (!$category) {
            return $this->failNotFound();
        }

        return $this->respond($category);
    }

    /**
     * PUT /categories/{id} - Update a specific category by ID
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

    /**
     * DELETE /categories/{id} - Delete a specific category by ID
     * @param $id
     * @return ResponseInterface
     */
    public function delete($id = null): ResponseInterface
    {
        $category = $this->model->getById($id);

        if (!$category) {
            return $this->failNotFound();
        }

        try {
            if (!$this->model->deleteById($id, $this->authLibrary->user->id)) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete category']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}