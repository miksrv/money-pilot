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

        if (empty(trim($input['name'] ?? ''))) {
            return $this->failValidationErrors(['name' => 'Name is required']);
        }

        if (strlen(trim($input['name'])) > 100) {
            return $this->failValidationErrors(['name' => 'Name cannot exceed 100 characters']);
        }

        try {
            $language = $input['language'] ?? 'en';
            $demoData = isset($input['demo_data']) ? (bool)$input['demo_data'] : true;

            $this->userModel->insert([
                'email'     => $input['email'],
                'password'  => $input['password'],
                'name'      => trim($input['name']),
                'language'  => $language,
                'is_active' => true,
            ]);

            $userId = $this->userModel->getInsertID();

            try {
                $seeder = new \App\Libraries\DefaultDataSeeder();
                $seeder->seed($userId, $language, $demoData);
            } catch (\Exception $e) {
                log_message('error', 'DefaultDataSeeder failed for user ' . $userId . ': ' . $e->getMessage());
            }

            $token = (new Auth())->login($userId);

            return $this->respondCreated(['token' => $token]);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}