<?php

namespace App\Validation;

use CodeIgniter\Database\Exceptions\DatabaseException;

/**
 * Custom validation rules for the Monetka application.
 */
class CustomRules
{
    /**
     * Checks that the given value exists as a row in the specified table/column.
     *
     * Usage in model: 'valid_id[table,column]'
     *
     * @param string|null $value  The value to look up.
     * @param string      $params Comma-separated "table,column" (e.g. "users,id").
     * @param array       $data   Full data array (unused).
     * @param string|null $error  Set to the error message on failure.
     */
    public function valid_id(?string $value, string $params, array $data, ?string &$error = null): bool
    {
        if ($value === null || $value === '') {
            // Let required/permit_empty handle empty-value logic.
            return true;
        }

        [$table, $column] = array_map('trim', explode(',', $params, 2));

        try {
            $db    = \Config\Database::connect();
            $count = $db->table($table)->where($column, $value)->countAllResults();
        } catch (DatabaseException $e) {
            $error = "Database error while validating {$column} in {$table}.";
            return false;
        }

        if ($count === 0) {
            $error = "The {$column} '{$value}' does not exist in {$table}.";
            return false;
        }

        return true;
    }

    /**
     * Validates that the given value is a boolean or can be interpreted as one.
     * Accepts: true, false, 1, 0, "1", "0", "true", "false"
     *
     * @param mixed       $value  The value to check.
     * @param string|null $error  Set to the error message on failure.
     */
    public function is_boolean($value, ?string &$error = null): bool
    {
        if ($value === null || $value === '') {
            // Let required/permit_empty handle empty-value logic.
            return true;
        }

        // Accept actual booleans
        if (is_bool($value)) {
            return true;
        }

        // Accept integer 0 or 1
        if ($value === 0 || $value === 1) {
            return true;
        }

        // Accept string representations
        if (is_string($value) && in_array(strtolower($value), ['0', '1', 'true', 'false'], true)) {
            return true;
        }

        $error = 'The {field} field must be a boolean value.';
        return false;
    }
}
