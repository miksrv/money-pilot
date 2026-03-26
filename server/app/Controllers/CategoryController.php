<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\CategoryModel;
use App\Models\GroupMemberModel;
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
    }

    /**
     * GET /categories - List all categories for the authenticated user
     * Supports query params: include_archived (bool), withSums (bool)
     * @return ResponseInterface
     */
    public function index(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $includeArchived = (bool)$this->request->getGet('include_archived');
        $withSums        = (bool)$this->request->getGet('withSums');
        $withChildren    = (bool)$this->request->getGet('withChildren');
        $groupId         = $this->request->getGet('group_id');
        $db              = db_connect();

        $queryUserId = $this->authLibrary->user->id;

        if ($groupId) {
            $groupMemberModel = new GroupMemberModel();
            $membership = $groupMemberModel
                ->where(['group_id' => $groupId, 'user_id' => $this->authLibrary->user->id])
                ->first();

            if (!$membership) {
                return $this->failForbidden('You are not a member of this group');
            }

            $group = $db->table('groups')->where('id', $groupId)->get()->getRowObject();

            if (!$group) {
                return $this->failNotFound('Group not found');
            }

            $queryUserId = $group->owner_id;
        }

        if ($withSums) {
            $categories = $this->model->findByUserIdWithSums($queryUserId);
        } elseif ($withChildren) {
            $categories = $this->model->findByUserIdWithChildren($queryUserId);
        } else {
            $categories = $this->model->findByUserId($queryUserId);
        }

        // Filter out archived unless requested
        if (!$includeArchived) {
            $categories = array_filter($categories, fn($c) => !(bool)($c->archived ?? false));
            $categories = array_values($categories);
        }

        $buildItem = function ($category) use ($db, $withSums) {
            $count = $db->table('transactions')
                ->where('category_id', $category->id)
                ->countAllResults();

            $item = [
                'id'                => $category->id,
                'name'              => $category->name,
                'type'              => $category->type,
                'parent_id'         => $category->parent_id,
                'is_parent'         => (bool)($category->is_parent ?? false),
                'icon'              => $category->icon,
                'color'             => $category->color,
                'budget'            => (float)($category->budget ?? 0),
                'archived'          => (bool)($category->archived ?? false),
                'transaction_count' => $count,
            ];

            if ($withSums) {
                $item['expenses'] = (float)($category->expenses ?? 0);
            }

            return $item;
        };

        $response = array_map(function ($category) use ($buildItem, $withChildren) {
            $item = $buildItem($category);

            if ($withChildren && isset($category->children)) {
                $item['children'] = array_map($buildItem, $category->children);
            }

            return $item;
        }, $categories);

        return $this->respond($response);
    }

    /**
     * POST /categories - Create a new category
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input    = $this->request->getJSON(true);
        $isParent = !empty($input['is_parent']);

        $rules    = $this->model->validationRules;
        $messages = $this->model->validationMessages;

        if ($isParent) {
            $rules['icon']   = 'permit_empty|string|max_length[50]';
            $rules['budget'] = 'permit_empty|decimal';
        }

        if (!$this->validateRequest($input, $rules, $messages)) {
            return $this->failValidationErrors(['error' => '1001', 'messages' => $this->validator->getErrors()]);
        }

        try {
            $this->model->insert([
                'user_id'   => $this->authLibrary->user->id,
                'group_id'  => !empty($input['group_id']) ? $input['group_id'] : null,
                'name'      => $input['name'],
                'type'      => $input['type'] ?? null,
                'is_parent' => $isParent ? 1 : 0,
                'icon'      => $input['icon'] ?? null,
                'color'     => $input['color'] ?? null,
                'budget'    => $isParent ? null : ($input['budget'] ?? null),
                'parent_id' => !empty($input['parent_id']) ? $input['parent_id'] : null,
            ]);

            if ($this->model->errors()) {
                return $this->failValidationErrors($this->model->errors());
            }

            return $this->respondCreated();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
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
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

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
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input    = $this->request->getJSON(true);
        $isParent = !empty($input['is_parent']);

        $rules    = $this->model->validationRules;
        $messages = $this->model->validationMessages;

        if ($isParent) {
            $rules['icon']   = 'permit_empty|string|max_length[50]';
            $rules['budget'] = 'permit_empty|decimal';
        }

        if (!$this->validateRequest($input, $rules, $messages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            $existing = $this->model->getById($id);
            $oldColor = $existing ? $existing->color : null;

            unset($input['id']);

            $input['budget']    = $isParent ? null : ($input['budget'] ?? null);
            $input['is_parent'] = $isParent ? 1 : 0;

            if (!$this->model->updateById($id, $this->authLibrary->user->id, $input)) {
                return $this->failValidationErrors($this->model->errors());
            }

            $newColor = $input['color'] ?? null;
            if ($newColor !== null && $newColor !== $oldColor) {
                if ($isParent) {
                    $this->model->propagateColorToChildren($id, $newColor);
                } elseif (!empty($input['parent_id'])) {
                    $this->model->propagateColorToParentAndSiblings($id, $newColor);
                }
            }

            return $this->respondUpdated();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * DELETE /categories/{id} - Delete a specific category by ID (blocked if it has transactions)
     * @param $id
     * @return ResponseInterface
     */
    public function delete($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $category = $this->model->getById($id);

        if (!$category) {
            return $this->failNotFound();
        }

        // Block if parent category still has children
        if ((bool)$category->is_parent) {
            $childCount = $this->model->where('parent_id', $id)->countAllResults();

            if ($childCount > 0) {
                return $this->fail(
                    ['error' => 'category_has_children'],
                    422
                );
            }
        }

        // Block if category is used by any transaction
        $transactionCount = db_connect()->table('transactions')
            ->where('category_id', $id)
            ->countAllResults();

        if ($transactionCount > 0) {
            return $this->fail(
                ['error' => 'category_has_transactions'],
                422
            );
        }

        try {
            if (!$this->model->deleteById($id, $this->authLibrary->user->id)) {
                return $this->fail(['error' => '1003', 'messages' => 'Failed to delete category']);
            }

            return $this->respondDeleted();
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * PATCH /categories/{id}/archive - Archive or unarchive a category
     * @param $id
     * @return ResponseInterface
     */
    public function archive($id = null): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $category = $this->model->getById($id);

        if (!$category) {
            return $this->failNotFound();
        }

        $input    = $this->request->getJSON(true);
        $archived = isset($input['archived']) ? (bool)$input['archived'] : true;

        try {
            $this->model->updateById($id, $this->authLibrary->user->id, ['archived' => $archived ? 1 : 0]);

            $updated = $this->model->getById($id);

            return $this->respond([
                'id'       => $updated->id,
                'name'     => $updated->name,
                'type'     => $updated->type,
                'icon'     => $updated->icon,
                'color'    => $updated->color,
                'budget'   => (float)($updated->budget ?? 0),
                'archived' => (bool)$updated->archived,
            ]);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}
