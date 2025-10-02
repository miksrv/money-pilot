<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use CodeIgniter\Validation\Exceptions\ValidationException;
use Config\Services;

class RegisterController extends ResourceController
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