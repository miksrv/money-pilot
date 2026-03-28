<?php

namespace App\Filters;

use App\Libraries\Auth;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Filters\FilterInterface;
use CodeIgniter\HTTP\RequestInterface;
use CodeIgniter\HTTP\ResponseInterface;

/**
 * Authentication filter that validates JWT tokens on protected routes.
 * Excluded routes: /auth/login, /auth/me, /register
 */
class AuthFilter implements FilterInterface
{
    use ResponseTrait;

    /**
     * Validates JWT authentication before allowing access to protected routes.
     *
     * @param RequestInterface $request
     * @param array|null       $arguments
     *
     * @return ResponseInterface|void
     */
    public function before(RequestInterface $request, $arguments = null)
    {
        $authLibrary = new Auth();

        if (!$authLibrary->isAuth) {
            $response = service('response');

            return $response
                ->setStatusCode(ResponseInterface::HTTP_UNAUTHORIZED)
                ->setJSON(['status' => 401, 'error' => 401, 'messages' => ['error' => 'Invalid or missing authentication token']]);
        }
    }

    /**
     * No post-processing needed.
     *
     * @param RequestInterface  $request
     * @param ResponseInterface $response
     * @param array|null        $arguments
     *
     * @return void
     */
    public function after(RequestInterface $request, ResponseInterface $response, $arguments = null): void
    {
        // No action needed after request
    }
}

