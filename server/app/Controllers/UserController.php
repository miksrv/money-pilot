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
            'language'   => $user->language ?? 'en',
            'currency'   => $user->currency ?? 'USD',
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

        $currency = strtoupper(trim($input['currency'] ?? ''));
        if ($currency !== '' && (strlen($currency) !== 3 || !ctype_alpha($currency))) {
            return $this->failValidationErrors(['currency' => 'Currency must be a 3-letter ISO 4217 code (e.g. USD)']);
        }

        $language = trim($input['language'] ?? '');
        if ($language !== '' && !in_array($language, ['en', 'ru'], true)) {
            return $this->failValidationErrors(['language' => 'Language must be one of: en, ru']);
        }

        try {
            $userModel = new UserModel();

            $updateData = [
                'name' => trim($input['name']),
            ];

            if ($currency !== '') {
                $updateData['currency'] = $currency;
            }

            if ($language !== '') {
                $updateData['language'] = $language;
            }

            $userModel->update($this->authLibrary->user->id, $updateData);

            // Return updated profile
            $updated = $userModel->find($this->authLibrary->user->id);

            return $this->respond([
                'id'       => $updated->id,
                'name'     => $updated->name,
                'email'    => $updated->email,
                'language' => $updated->language ?? 'en',
                'currency' => $updated->currency ?? 'USD',
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
            $db->transStart();

            // Hard delete in FK-safe order (most dependent first)
            $db->table('sessions')->where('user_id', $userId)->delete();
            $db->table('subscriptions')->where('user_id', $userId)->delete();
            $db->table('transactions')->where('user_id', $userId)->delete();
            $db->table('recurring_transactions')->where('user_id', $userId)->delete();
            $db->table('accounts')->where('user_id', $userId)->delete();
            $db->table('categories')->where('user_id', $userId)->delete();
            $db->table('payees')->where('created_by_user_id', $userId)->delete();
            $db->table('group_invitations')->where('invited_user_id', $userId)->delete();
            $db->table('group_invitations')->where('inviter_user_id', $userId)->delete();
            $db->table('group_members')->where('user_id', $userId)->delete();

            // Finally delete the user
            $db->table('users')->where('id', $userId)->delete();

            $db->transComplete();

            if ($db->transStatus() === false) {
                log_message('error', __METHOD__ . ': Transaction failed for user ' . $userId);
                return $this->fail('Failed to delete user account');
            }

            return $this->respond(null, 204);
        } catch (\Exception $e) {
            log_message('error', __METHOD__ . ': ' . $e->getMessage());
            return $this->fail($e->getMessage());
        }
    }
}
