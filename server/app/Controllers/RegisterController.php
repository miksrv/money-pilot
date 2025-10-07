<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class RegisterController extends ApplicationBaseController
{
    use ResponseTrait;

    protected UserModel $userModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
    }

    /**
     * Register a new user.
     *
     * @return ResponseInterface
     */
    public function create(): ResponseInterface
    {
        $input = $this->request->getJSON(true);

        if (!$this->validateRequest($input, $this->userModel->validationRules, $this->userModel->validationMessages)) {
            return $this->failValidationErrors($this->validator->getErrors());
        }

        try {
            $userId = $this->userModel->insert([
                'email'     => $input['email'],
                'password'  => $input['password'],
                'name'      => $input['name'] ?? null,
                'is_active' => true,
            ]);

            $token = (new Auth())->login($userId);

            return $this->respondCreated(['token' => $token]);
        } catch (\Exception $e) {
            return $this->fail($e->getMessage());
        }
    }
}