<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\UserModel;
use App\Models\SessionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;

class AuthController extends ResourceController
{
    use ResponseTrait;

    protected UserModel $userModel;
    protected SessionModel $sessionModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->sessionModel = new SessionModel();
    }

    public function me(): ResponseInterface
    {
        $authLibrary = new Auth();

        if (!$authLibrary->isAuth || !$authLibrary->user) {
            return $this->failUnauthorized();
        }

        return $this->respond([
            'id'    => $authLibrary->user->id,
            'name'  => $authLibrary->user->name,
            'token' => $authLibrary->refresh()
        ]);
    }

    public function login(): ResponseInterface
    {
        $data = $this->request->getJSON(true);
        $email = $data['email'] ?? null;
        $password = $data['password'] ?? null;

        if (!$email || !$password) {
            return $this->failValidationErrors('Email and password are required');
        }

        $user = $this->userModel->findByEmail($email);

        if (!$user || !$user->verifyPassword($password)) {
            return $this->failUnauthorized('Invalid credentials');
        }

        if (!$user->is_active) {
            return $this->failForbidden('Account is deactivated');
        }

        $token = (new Auth())->login($user->id);

        return $this->respond(['token' => $token]);
    }

    /**
     * Logout the current user by deleting their session.
     * @return ResponseInterface
     */
    public function logout(): ResponseInterface
    {
        $authLibrary = new Auth();

        if (!$authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $this->sessionModel->delete($authLibrary->sessionId);

        return $this->respondDeleted();
    }
}