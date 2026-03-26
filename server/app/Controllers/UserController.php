<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\SessionModel;
use App\Models\UserModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class UserController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->authLibrary = new Auth();
    }

    /**
     * GET /users/profile
     */
    public function profile(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $user = $this->authLibrary->user;

        return $this->respond([
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'created_at' => $user->created_at instanceof \CodeIgniter\I18n\Time
                ? $user->created_at->toDateTimeString()
                : (string)$user->created_at,
        ]);
    }

    /**
     * PUT /users/profile
     */
    public function updateProfile(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);

        if (empty(trim($input['name'] ?? ''))) {
            return $this->failValidationErrors(['name' => 'Name is required']);
        }

        try {
            $userModel = new UserModel();
            $userModel->update($this->authLibrary->user->id, [
                'name'  => trim($input['name']),
                'phone' => $input['phone'] ?? null,
            ]);

            // Return updated profile
            $updated = $userModel->find($this->authLibrary->user->id);

            return $this->respond([
                'id'    => $updated->id,
                'name'  => $updated->name,
                'email' => $updated->email,
                'phone' => $updated->phone,
            ]);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * PUT /users/password
     */
    public function changePassword(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $input = $this->request->getJSON(true);

        $currentPassword = $input['current_password'] ?? '';
        $newPassword     = $input['new_password'] ?? '';

        if (empty($currentPassword) || empty($newPassword)) {
            return $this->failValidationErrors(['password' => 'Both current and new password are required']);
        }

        if (strlen($newPassword) < 8) {
            return $this->failValidationErrors(['new_password' => 'New password must be at least 8 characters']);
        }

        // Verify current password
        if (!$this->authLibrary->user->verifyPassword($currentPassword)) {
            return $this->fail(
                ['error' => 'wrong_current_password'],
                422
            );
        }

        try {
            $userModel    = new UserModel();
            $sessionModel = new SessionModel();

            // Update password (UserModel's beforeUpdate hook hashes it)
            $userModel->update($this->authLibrary->user->id, ['password' => $newPassword]);

            // Invalidate ALL sessions for this user (force re-login everywhere)
            $sessionModel->deleteByUserId($this->authLibrary->user->id);

            return $this->respond(null, 204);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }

    /**
     * DELETE /users/me
     */
    public function deleteMe(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        try {
            $db = db_connect();

            // Hard delete in FK-safe order
            $db->table('sessions')->where('user_id', $userId)->delete();
            $db->table('transactions')->where('user_id', $userId)->delete();
            $db->table('accounts')->where('user_id', $userId)->delete();
            $db->table('categories')->where('user_id', $userId)->delete();
            $db->table('payees')->where('user_id', $userId)->delete();
            $db->table('users')->where('id', $userId)->delete();

            return $this->respond(null, 204);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}
