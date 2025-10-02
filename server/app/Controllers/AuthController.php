<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\UserModel;
use App\Models\SessionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\RESTful\ResourceController;
use Firebase\JWT\JWT;

class AuthController extends ResourceController
{
    use ResponseTrait;

    protected $userModel;
    protected $sessionModel;

    public function __construct()
    {
        $this->userModel = new UserModel();
        $this->sessionModel = new SessionModel();
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

    public function refresh()
    {
        $data = $this->request->getJSON(true);
        $refreshToken = $data['refresh_token'] ?? null;

        if (!$refreshToken) {
            return $this->failValidationErrors('Refresh token is required');
        }

        $session = $this->sessionModel->findByToken($refreshToken);
        if (!$session || $session->expires_at < date('Y-m-d H:i:s')) {
            return $this->failUnauthorized('Invalid or expired refresh token');
        }

        $user = $this->userModel->find($session->user_id);
        if (!$user || !$user->is_active) {
            return $this->failForbidden('User not found or deactivated');
        }

        $newAccessToken = $this->generateAccessToken($user->id);
        $newRefreshToken = $this->generateRefreshToken();

        $this->sessionModel->update($session->id, [
            'token' => $newRefreshToken,
            'expires_at' => date('Y-m-d H:i:s', strtotime('+30 days')),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->respond([
            'token' => $newAccessToken,
            'refresh_token' => $newRefreshToken,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
            ],
        ]);
    }

    public function logout()
    {
        $data = $this->request->getJSON(true);
        $refreshToken = $data['refresh_token'] ?? null;

        if (!$refreshToken) {
            return $this->failValidationErrors('Refresh token is required');
        }

        $session = $this->sessionModel->findByToken($refreshToken);
        if ($session) {
            $this->sessionModel->delete($session->id);
        }

        return $this->respondDeleted(['message' => 'Logged out successfully']);
    }

    private function generateId(): string
    {
        return substr(bin2hex(random_bytes(8)), 0, 15);
    }

    private function generateAccessToken(string $userId): string
    {
        $payload = [
            'iss' => 'moneyflow',
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + (60 * 60), // 1 hour
        ];
        return JWT::encode($payload, getenv('JWT_SECRET'), 'HS256');
    }

    private function generateRefreshToken(): string
    {
        return bin2hex(random_bytes(32));
    }
}