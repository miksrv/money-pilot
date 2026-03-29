# Feature 21 — Registration Improvements & User Profile Cleanup

## Goal

Three related improvements to the user model and registration flow:

1. **Remove `phone`** — useless field, purge from DB, backend, and frontend.
2. **Improve registration form** — add full name field + language selector (auto-detected from browser).
3. **Auto-seed data on registration** — create default categories and a personal group immediately after sign-up, localized to the chosen language.

---

## 21.1 — Remove Phone Field

### Backend

**Migration** — new file: `server/app/Database/Migrations/<timestamp>_RemovePhoneFromUsers.php`

```php
public function up()
{
    $this->db->query('ALTER TABLE `users` DROP COLUMN `phone`');
}

public function down()
{
    $this->db->query('ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL AFTER `name`');
}
```

**`UserModel`** — remove from `$allowedFields` and `$validationRules`:

```php
protected $allowedFields = ['email', 'password', 'name', 'language', 'currency', 'is_active', 'last_login'];
// remove 'phone' entry from $validationRules
```

**`UserController`** — remove `phone` from the response shape (in `show()` and `update()` methods) and from the update logic.

### Frontend

Search for any `phone` references in `client/src/screens/settings/` and remove:
- Form field in Settings profile form
- `phone` key in the API request body
- `phone` in the `ApiModel.User` type definition

---

## 21.2 — Add `language` Field

### Backend

**Migration** — add to the same migration file as above (or a separate one):

```php
public function up()
{
    $this->db->query("
        ALTER TABLE `users`
        ADD COLUMN `language` VARCHAR(10) NULL DEFAULT NULL AFTER `name`
    ");
}

public function down()
{
    $this->db->query('ALTER TABLE `users` DROP COLUMN `language`');
}
```

Supported values: `'en'`, `'ru'` (extend as more locales are added). Store as BCP 47 short tag.

**`UserModel`** — add `'language'` to `$allowedFields`. Add validation:

```php
'language' => 'permit_empty|in_list[en,ru]',
```

**`UserController`** — include `language` in response shape and allow updating it (same pattern as `currency`).

**`RegisterController`** — accept `language` from request body and pass to insert:

```php
$userId = $this->userModel->insert([
    'email'     => $input['email'],
    'password'  => $input['password'],
    'name'      => trim($input['name'] ?? ''),
    'language'  => $input['language'] ?? 'en',
    'is_active' => true,
]);
```

### Frontend

**`ApiModel.User`** — add `language?: string`.

**Settings screen** — add a `Select` for language in the profile section:

```tsx
<Select
    label={t('settings.language', 'Language')}
    value={language}
    options={LANGUAGE_OPTIONS}
    onChange={…}
/>
```

`LANGUAGE_OPTIONS` in `constants.ts`:

```typescript
export const LANGUAGE_OPTIONS = [
    { key: 'en', value: 'English' },
    { key: 'ru', value: 'Русский' },
]
```

On save, call the existing user update mutation with `{ language }`.

---

## 21.3 — Improve Registration Form

### Frontend

**`RegisterFormData`** type — add `name` and `language`:

```typescript
type RegisterFormData = {
    email: string
    password: string
    name: string
    language: string
}
```

**`Register.tsx`** — add fields:

1. **Full name** — `<Input>` above the email field:

```tsx
<Input
    label={t('register.input_name_title', 'Full name')}
    placeholder={t('register.input_name_placeholder', 'Your name')}
    error={errors.name?.message}
    {...register('name', {
        required: t('register.input_name_required_error', 'Name is required'),
        maxLength: { value: 100, message: t('register.input_name_max_length', 'Max 100 characters') }
    })}
/>
```

2. **Language selector** — `<Select>` below the email field, before password. Default value pre-populated from browser:

```typescript
const defaultLanguage = navigator.language.startsWith('ru') ? 'ru' : 'en'
```

```tsx
<Select
    label={t('register.input_language_title', 'Language')}
    options={LANGUAGE_OPTIONS}
    value={watch('language')}
    onChange={(items) => setValue('language', items?.[0]?.key ?? 'en')}
/>
```

Set default in `useForm`:

```typescript
const { … } = useForm<RegisterFormData>({
    defaultValues: {
        language: navigator.language.startsWith('ru') ? 'ru' : 'en',
    }
})
```

**API mutation** — pass all new fields:

```typescript
await registerMutation({
    email: data.email,
    password: data.password,
    name: data.name,
    language: data.language,
}).unwrap()
```

**`LANGUAGE_OPTIONS`** — extract to `client/src/screens/register/constants.ts` and re-use in Settings.

---

## 21.4 — Auto-Seed Default Data on Registration

### Design

After a user registers, automatically create:
- A **personal group** ("Personal" / "Личный бюджет") with the user as the owner.
- A set of **default categories** (expense + income), localized to the user's chosen language.

This happens server-side in `RegisterController`, immediately after the user is inserted and before the token is returned.

### Backend

**New library:** `server/app/Libraries/DefaultDataSeeder.php`

```php
namespace App\Libraries;

class DefaultDataSeeder
{
    public function seed(string $userId, string $language): void
    {
        $this->createDefaultGroup($userId, $language);
        $this->createDefaultCategories($userId, $language);
    }

    private function createDefaultGroup(string $userId, string $language): void { … }
    private function createDefaultCategories(string $userId, string $language): void { … }
}
```

**Default categories data** (defined as a private constant/method inside `DefaultDataSeeder`):

```php
private function getCategoryTemplates(string $language): array
{
    $templates = [
        'en' => [
            ['name' => 'Income',        'type' => 'income',   'is_parent' => 1, 'icon' => '💰', 'color' => 'green'],
            ['name' => 'Salary',        'type' => 'income',   'is_parent' => 0, 'icon' => '💼', 'color' => 'green',  'parent' => 'Income'],
            ['name' => 'Freelance',     'type' => 'income',   'is_parent' => 0, 'icon' => '💻', 'color' => 'teal',   'parent' => 'Income'],
            ['name' => 'Gifts',         'type' => 'income',   'is_parent' => 0, 'icon' => '🎁', 'color' => 'lime',   'parent' => 'Income'],

            ['name' => 'Food',          'type' => 'expense',  'is_parent' => 1, 'icon' => '🍔', 'color' => 'orange'],
            ['name' => 'Groceries',     'type' => 'expense',  'is_parent' => 0, 'icon' => '🛒', 'color' => 'orange', 'parent' => 'Food'],
            ['name' => 'Restaurants',   'type' => 'expense',  'is_parent' => 0, 'icon' => '🍽️', 'color' => 'red',    'parent' => 'Food'],

            ['name' => 'Transport',     'type' => 'expense',  'is_parent' => 1, 'icon' => '🚗', 'color' => 'blue'],
            ['name' => 'Fuel',          'type' => 'expense',  'is_parent' => 0, 'icon' => '⛽', 'color' => 'blue',   'parent' => 'Transport'],
            ['name' => 'Public transit','type' => 'expense',  'is_parent' => 0, 'icon' => '🚌', 'color' => 'sky',    'parent' => 'Transport'],

            ['name' => 'Shopping',      'type' => 'expense',  'is_parent' => 1, 'icon' => '🛍️', 'color' => 'purple'],
            ['name' => 'Clothing',      'type' => 'expense',  'is_parent' => 0, 'icon' => '👕', 'color' => 'purple', 'parent' => 'Shopping'],
            ['name' => 'Electronics',   'type' => 'expense',  'is_parent' => 0, 'icon' => '📱', 'color' => 'indigo', 'parent' => 'Shopping'],

            ['name' => 'Health',        'type' => 'expense',  'is_parent' => 1, 'icon' => '💊', 'color' => 'pink'],
            ['name' => 'Pharmacy',      'type' => 'expense',  'is_parent' => 0, 'icon' => '🏥', 'color' => 'pink',   'parent' => 'Health'],
            ['name' => 'Sport',         'type' => 'expense',  'is_parent' => 0, 'icon' => '🏋️', 'color' => 'lime',   'parent' => 'Health'],

            ['name' => 'Housing',       'type' => 'expense',  'is_parent' => 1, 'icon' => '🏠', 'color' => 'yellow'],
            ['name' => 'Rent',          'type' => 'expense',  'is_parent' => 0, 'icon' => '🔑', 'color' => 'yellow', 'parent' => 'Housing'],
            ['name' => 'Utilities',     'type' => 'expense',  'is_parent' => 0, 'icon' => '💡', 'color' => 'amber',  'parent' => 'Housing'],

            ['name' => 'Entertainment', 'type' => 'expense',  'is_parent' => 1, 'icon' => '🎮', 'color' => 'violet'],
            ['name' => 'Subscriptions', 'type' => 'expense',  'is_parent' => 0, 'icon' => '📺', 'color' => 'violet', 'parent' => 'Entertainment'],
        ],
        'ru' => [
            ['name' => 'Доходы',        'type' => 'income',   'is_parent' => 1, 'icon' => '💰', 'color' => 'green'],
            ['name' => 'Зарплата',      'type' => 'income',   'is_parent' => 0, 'icon' => '💼', 'color' => 'green',  'parent' => 'Доходы'],
            ['name' => 'Фриланс',       'type' => 'income',   'is_parent' => 0, 'icon' => '💻', 'color' => 'teal',   'parent' => 'Доходы'],
            ['name' => 'Подарки',       'type' => 'income',   'is_parent' => 0, 'icon' => '🎁', 'color' => 'lime',   'parent' => 'Доходы'],

            ['name' => 'Еда',           'type' => 'expense',  'is_parent' => 1, 'icon' => '🍔', 'color' => 'orange'],
            ['name' => 'Продукты',      'type' => 'expense',  'is_parent' => 0, 'icon' => '🛒', 'color' => 'orange', 'parent' => 'Еда'],
            ['name' => 'Рестораны',     'type' => 'expense',  'is_parent' => 0, 'icon' => '🍽️', 'color' => 'red',    'parent' => 'Еда'],

            ['name' => 'Транспорт',     'type' => 'expense',  'is_parent' => 1, 'icon' => '🚗', 'color' => 'blue'],
            ['name' => 'Топливо',       'type' => 'expense',  'is_parent' => 0, 'icon' => '⛽', 'color' => 'blue',   'parent' => 'Транспорт'],
            ['name' => 'Общественный',  'type' => 'expense',  'is_parent' => 0, 'icon' => '🚌', 'color' => 'sky',    'parent' => 'Транспорт'],

            ['name' => 'Покупки',       'type' => 'expense',  'is_parent' => 1, 'icon' => '🛍️', 'color' => 'purple'],
            ['name' => 'Одежда',        'type' => 'expense',  'is_parent' => 0, 'icon' => '👕', 'color' => 'purple', 'parent' => 'Покупки'],
            ['name' => 'Электроника',   'type' => 'expense',  'is_parent' => 0, 'icon' => '📱', 'color' => 'indigo', 'parent' => 'Покупки'],

            ['name' => 'Здоровье',      'type' => 'expense',  'is_parent' => 1, 'icon' => '💊', 'color' => 'pink'],
            ['name' => 'Аптека',        'type' => 'expense',  'is_parent' => 0, 'icon' => '🏥', 'color' => 'pink',   'parent' => 'Здоровье'],
            ['name' => 'Спорт',         'type' => 'expense',  'is_parent' => 0, 'icon' => '🏋️', 'color' => 'lime',   'parent' => 'Здоровье'],

            ['name' => 'Жильё',         'type' => 'expense',  'is_parent' => 1, 'icon' => '🏠', 'color' => 'yellow'],
            ['name' => 'Аренда',        'type' => 'expense',  'is_parent' => 0, 'icon' => '🔑', 'color' => 'yellow', 'parent' => 'Жильё'],
            ['name' => 'Коммуналка',    'type' => 'expense',  'is_parent' => 0, 'icon' => '💡', 'color' => 'amber',  'parent' => 'Жильё'],

            ['name' => 'Развлечения',   'type' => 'expense',  'is_parent' => 1, 'icon' => '🎮', 'color' => 'violet'],
            ['name' => 'Подписки',      'type' => 'expense',  'is_parent' => 0, 'icon' => '📺', 'color' => 'violet', 'parent' => 'Развлечения'],
        ],
    ];

    return $templates[$language] ?? $templates['en'];
}
```

**Seeding logic in `DefaultDataSeeder`:**

- Insert parent categories first, collect their generated IDs.
- Insert child categories with `parent_id` resolved from the parents map.
- Use `CategoryModel` for insert (so `generateId` callback fires).
- All categories get `user_id = $userId`.

**Group creation:**

```php
private function createDefaultGroup(string $userId, string $language): void
{
    $name = $language === 'ru' ? 'Личный бюджет' : 'Personal';
    $groupModel = model('GroupModel');
    $groupId = $groupModel->insert([
        'name'       => $name,
        'created_by' => $userId,
    ]);
    // add user as member (owner role)
    model('GroupMemberModel')->insert([
        'group_id' => $groupId,
        'user_id'  => $userId,
        'role'     => 'owner',
    ]);
}
```

**`RegisterController::create()`** — call the seeder after user insert:

```php
$seeder = new \App\Libraries\DefaultDataSeeder();
$seeder->seed($userId, $input['language'] ?? 'en');
```

> Wrap in try/catch so a seeding failure doesn't block the registration — log the error but still return the token.

### Frontend

No additional frontend changes needed for seeding — the app already fetches categories and groups after login via RTK Query.

The only UX note: after registration, when the user lands on the Dashboard for the first time, they will see their default categories and group already populated.

---

## i18n Keys

```
register.input_name_title
register.input_name_placeholder
register.input_name_required_error
register.input_name_max_length
register.input_language_title
settings.language
settings.languageSaved
```

---

## Acceptance Criteria

### 21.1 — Remove phone
- [ ] `phone` column dropped from `users` table via migration.
- [ ] `UserModel`, `UserController` no longer reference `phone`.
- [ ] Settings UI has no phone field.

### 21.2 — Language field
- [ ] `language` column added to `users` table.
- [ ] `UserController` returns and accepts `language`.
- [ ] Settings screen shows a language selector; saving it updates the DB.

### 21.3 — Registration form
- [ ] Registration form has a "Full name" field (required).
- [ ] Registration form has a language selector, pre-filled from `navigator.language`.
- [ ] `name` and `language` are sent to `POST /register` and saved to `users`.

### 21.4 — Default data seeding
- [ ] After registration, the user has a default personal group.
- [ ] After registration, the user has ~20 default categories (income + expense), localized to the chosen language.
- [ ] A seeding failure does **not** break registration — user still gets their token.
- [ ] Dashboard on first login shows the pre-seeded categories.
