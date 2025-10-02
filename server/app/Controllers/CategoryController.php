<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\CategoryModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\RESTful\ResourceController;

class CategoryController extends ResourceController
{
    use ResponseTrait;

    protected $modelName = 'App\Models\CategoryModel';
    protected $format = 'json';

    public function __construct()
    {
        $this->model = new $this->modelName();
    }

    // GET /api/categories - Получить категории
    public function index()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $categories = $this->model->where('user_id', $userId)->findAll();
        return $this->respond($categories);
    }

    // POST /api/categories - Создать категорию
    public function create()
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        $data['user_id'] = $userId;
        $data['type'] = $data['type'] ?? 'expense';

        if (!$this->model->insert($data)) {
            return $this->fail($this->model->errors());
        }

        $category = $this->model->find($data['id']);
        return $this->respondCreated($category);
    }

    // GET /api/categories/{id} - Получить категорию по ID
    public function show($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $category = $this->model->where(['id' => $id, 'user_id' => $userId])->first();
        if (!$category) {
            return $this->failNotFound('Category not found');
        }

        return $this->respond($category);
    }

    // PUT /api/categories/{id} - Обновить категорию
    public function update($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        $data = $this->request->getJSON(true);
        unset($data['id'], $data['user_id']);

        if (!$this->model->update($id, $data, ['user_id' => $userId])) {
            return $this->fail($this->model->errors());
        }

        $category = $this->model->find($id);
        return $this->respondUpdated($category);
    }

    // DELETE /api/categories/{id} - Удалить категорию
    public function delete($id = null)
    {
        $userId = Auth::getUserIdFromToken();
        if (!$userId) {
            return $this->failUnauthorized('Invalid token');
        }

        if (!$this->model->delete($id, ['user_id' => $userId])) {
            return $this->fail('Failed to delete category');
        }

        return $this->respondDeleted(['message' => 'Category deleted successfully']);
    }
}