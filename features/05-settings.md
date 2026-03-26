# Feature 05 — Settings & Profile

## Goal

Build the Settings screen (currently an empty stub) covering: user profile editing, password change, theme toggle (dark/light), language selection, and a danger zone for account deletion.

---

## UI / UX Requirements

- Single-page settings screen with grouped sections using `Container` components.
- No tabs — scroll-based layout (mobile friendly).
- All forms via React Hook Form + `simple-react-ui-kit` inputs.
- Theme toggle switches immediately (no page reload).
- Language change reloads i18n resources but does not reload the page.
- Danger zone section at the bottom, visually separated.

---

## Settings Sections

### 1. Profile
- Full name (`Input`)
- Email (`Input`, read-only — cannot change email in MVP)
- Phone (`Input`, optional)
- Avatar — display initials as a colored circle (no image upload in MVP)
- Save button → `PUT /users/profile`

### 2. Security
- Change password form:
  - Current password (`Input type="password"`)
  - New password (`Input type="password"`)
  - Confirm new password (`Input type="password"`)
  - Inline validation: passwords must match, min 8 characters
  - Save button → `PUT /users/password`

### 3. Preferences
- **Theme**: segmented toggle or `Select` — Light / Dark / System
  - On change: update `data-theme` attribute on `<html>`, persist to localStorage
- **Language**: `Select` — English / Russian (or whatever locales are configured)
  - On change: call `i18n.changeLanguage()`, persist to localStorage

### 4. Danger Zone
- "Delete my account" — `Button variant="negative"`
- Opens `Dialog` with strong warning (`Message type="error"`) and a text confirmation input (user must type "DELETE")
- On confirm: `DELETE /users/me` → logout → redirect to `/login`

---

## Frontend Tasks

### New files
- `client/src/screens/Settings/index.tsx` — main screen (replace empty stub)
- `client/src/screens/Settings/Settings.module.sass`

### Modified files
- `client/src/api/api.ts` — add `updateProfile`, `changePassword`, `deleteAccount` (user account) endpoints
- `client/src/store/authSlice.ts` — add `displayName` and `language` to persisted state if not present
- `client/src/tools/i18n.ts` — ensure `changeLanguage` persists to localStorage and is read on init

### New RTK Query endpoints
```typescript
getProfile: builder.query<UserProfile, void>({
    query: () => '/users/profile',
    providesTags: ['User'],
})

updateProfile: builder.mutation<UserProfile, UpdateProfileBody>({
    query: (body) => ({ url: '/users/profile', method: 'PUT', body }),
    invalidatesTags: ['User'],
})

changePassword: builder.mutation<void, ChangePasswordBody>({
    query: (body) => ({ url: '/users/password', method: 'PUT', body }),
})

deleteMyAccount: builder.mutation<void, void>({
    query: () => ({ url: '/users/me', method: 'DELETE' }),
})
```

### Theme logic
```typescript
// Read from localStorage on app init (in App.tsx or index.tsx)
const savedTheme = localStorage.getItem('theme') ?? 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

// On change
const applyTheme = (theme: 'light' | 'dark' | 'system') => {
    const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem('theme', theme)
}
```

### Translations (i18n keys to add)
```
settings.title
settings.profile.title
settings.profile.fullName
settings.profile.email
settings.profile.phone
settings.profile.save
settings.profile.saved
settings.security.title
settings.security.currentPassword
settings.security.newPassword
settings.security.confirmPassword
settings.security.passwordMismatch
settings.security.passwordTooShort
settings.security.changePassword
settings.preferences.title
settings.preferences.theme
settings.preferences.themeLight
settings.preferences.themeDark
settings.preferences.themeSystem
settings.preferences.language
settings.dangerZone.title
settings.dangerZone.deleteAccount
settings.dangerZone.deleteConfirmTitle
settings.dangerZone.deleteConfirmBody
settings.dangerZone.typeToConfirm
settings.dangerZone.confirmWord
settings.dangerZone.delete
```

---

## Backend Tasks

### 1. Profile endpoints

`GET /users/profile`:
- Returns `{ id, name, email, phone, created_at }` for authenticated user.

`PUT /users/profile`:
- Accepts `{ name, phone }` (email is not updatable).
- Validates `name` is not empty.
- Returns updated profile.

### 2. Password change

`PUT /users/password`:
- Accepts `{ current_password, new_password }`.
- Verify `current_password` against stored bcrypt hash.
- If invalid: `HTTP 422 { "error": "wrong_current_password" }`.
- Hash and store new password.
- Invalidate all sessions (delete from `sessions` table for this user) — force re-login.
- Return `HTTP 204`.

### 3. Account deletion

`DELETE /users/me`:
- Soft approach (MVP): mark user as `deleted_at = NOW()` (add column via migration).
- Or hard delete: cascade-delete all user data in order: sessions → transactions → accounts → categories → payees → groups (if owner) → user.
- Return `HTTP 204`.
- Frontend must call `/auth/logout` first to clear the session token.

### New routes to register
```php
$routes->get('users/profile', 'UserController::profile');
$routes->put('users/profile', 'UserController::updateProfile');
$routes->put('users/password', 'UserController::changePassword');
$routes->delete('users/me', 'UserController::deleteMe');
```

### New controller
`server/app/Controllers/UserController.php`:
- Extend `ApplicationBaseController`.
- Apply JWT filter.
- Implement: `profile()`, `updateProfile()`, `changePassword()`, `deleteMe()`.

---

## Acceptance Criteria

- [ ] Profile form loads with current user data and saves correctly.
- [ ] Password change validates current password, enforces min length and match.
- [ ] Password change invalidates all other sessions (user is logged out on other devices).
- [ ] Theme toggle applies immediately and persists across page reloads.
- [ ] Language toggle changes UI language without a full page reload.
- [ ] Delete account requires typing "DELETE" in a confirmation field.
- [ ] After account deletion, user is redirected to the login screen.
- [ ] All strings translated.
