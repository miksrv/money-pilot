<?php

namespace App\Libraries;

use App\Entities\User;
use App\Models\SessionModel;
use App\Models\UserModel;
use CodeIgniter\HTTP\CLIRequest;
use CodeIgniter\HTTP\IncomingRequest;
use Config\Services;
use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use ReflectionException;

class Auth
{
    public User | null $user = null;
    public bool $isAuth = false;

    protected SessionModel $sessionModel;
    protected UserModel $userModel;

    private IncomingRequest|CLIRequest $request;

    public function __construct()
    {
        $this->request = Services::request();
        $this->sessionModel = new SessionModel();
        $this->userModel    = new UserModel();

        $token = $this->request->getServer('HTTP_AUTHORIZATION') ?? null;
        $user  = $this->findUserByToken($token);

        if ($user) {
            $this->user   = $user;
            $this->isAuth = true;
        }
    }

    /**
     * Logs in a user by generating a JWT token and creating a session.
     * @param string $userId
     * @return string The generated JWT token.
     * @throws ReflectionException
     * @throws Exception
     */
    public function login(string $userId): string
    {
        $token = $this->generateAccessToken($userId);

        $userData = $this->userModel->find($userId);

        if (!$userData) {
            throw new Exception('User not found');
        }

        $this->sessionModel->insert([
            'user_id'    => $userId,
            'token'      => $token,
            'device'     => $this->request->getUserAgent()->getAgentString(),
            'ip_address' => $this->request->getIPAddress(),
            'expires_at' => date('Y-m-d H:i:s', time() + getenv('auth.token.live')),
        ]);

        $this->userModel->update($userId, ['last_login' => date('Y-m-d H:i:s')]);

        return $token;
    }

    /**
     * Logs out the user by deleting their session.
     * @param string $userId
     * @return void
     */
    public function logout(string $userId): void {
        $this->sessionModel->deleteByUserId($userId);
        $this->user   = null;
        $this->isAuth = false;
    }

    /**
     * Refreshes the JWT token for a user by generating a new token and deleting the old session.
     * @param string $userId
     * @return string The new JWT token.
     * @throws Exception
     */
    public function refresh(string $userId): string {
        if (!$this->user) {
            throw new Exception('Invalid token');
        }

        $token     = $this->generateAccessToken($userId);
        $sessionId = $this->sessionModel->findByUserId($userId);

        $this->sessionModel->update($sessionId, [
            'token'      => $token,
            'device'     => $this->request->getUserAgent()->getAgentString(),
            'ip_address' => $this->request->getIPAddress(),
            'expires_at' => date('Y-m-d H:i:s', time() + getenv('auth.token.live')),
        ]);

       return $token;
    }

    /**
     * Generates a JWT access token for a given user ID.
     * @param string $userId
     * @return string
     * @throws Exception
     */
    protected function generateAccessToken(string $userId): string
    {
        $issuedAtTime    = time();
        $tokenTimeToLive = getenv('auth.token.live');
        $tokenExpiration = $issuedAtTime + ($tokenTimeToLive);

        $payload = [
            'sub' => $userId,
            'iat' => $issuedAtTime,
            'exp' => $tokenExpiration,
        ];

        return JWT::encode($payload, getenv('auth.token.secret'), 'HS256');
    }

    /**
     * @param string|null $token
     * @return User|null
     */
    protected function findUserByToken(string $token = null):? User {
        if (!$token) {
            return null;
        }

        try {
            $decoded  = JWT::decode($token, new Key(getenv('auth.token.secret'), 'HS256'));
            return $this->sessionModel->getUserBySessionId($decoded->sub) ?? null;
        } catch (\Throwable $e) {
            log_message('error', $e);

            return null;
        }
    }
}