<?php

namespace App\Validation;

use CodeIgniter\Database\Exceptions\DatabaseException;

/**
 * Custom validation rules for the Money Pilot application.
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
}
