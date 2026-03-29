<?php

namespace App\Controllers;

use App\Libraries\Auth;
use App\Models\AccountModel;
use App\Models\CategoryModel;
use App\Models\PayeeModel;
use App\Models\TransactionModel;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\HTTP\ResponseInterface;

class ImportController extends ApplicationBaseController
{
    use ResponseTrait;

    protected Auth $authLibrary;

    public function __construct()
    {
        $this->authLibrary = new Auth();
    }

    /**
     * POST /import/csv - Import transactions from a CSV file
     * @return ResponseInterface
     */
    public function csv(): ResponseInterface
    {
        if (!$this->authLibrary->isAuth) {
            return $this->failUnauthorized();
        }

        $userId = $this->authLibrary->user->id;

        // --- Validate uploaded file ---
        $file = $this->request->getFile('file');

        if (!$file || !$file->isValid()) {
            return $this->failValidationErrors(['file' => 'A valid CSV file is required.']);
        }

        if (strtolower($file->getClientExtension()) !== 'csv') {
            return $this->failValidationErrors(['file' => 'File must have a .csv extension.']);
        }

        if ($file->getSize() > 10 * 1024 * 1024) {
            return $this->failValidationErrors(['file' => 'File size must not exceed 10 MB.']);
        }

        $content = file_get_contents($file->getTempName());

        if ($content === false) {
            return $this->fail('Could not read the uploaded file.', 500);
        }

        // --- Parse CSV lines ---
        $lines = explode("\n", str_replace("\r\n", "\n", str_replace("\r", "\n", $content)));

        // Strip BOM if present
        if (!empty($lines[0])) {
            $lines[0] = preg_replace('/^\xEF\xBB\xBF/', '', $lines[0]);
        }

        // Skip "sep=," header line if present
        if (isset($lines[0]) && strtolower(trim($lines[0])) === 'sep=,') {
            array_shift($lines);
        }

        if (empty($lines)) {
            return $this->failValidationErrors(['file' => 'CSV file is empty.']);
        }

        // Parse header row
        $headerLine = array_shift($lines);
        $headers = str_getcsv($headerLine);
        $headers = array_map('trim', $headers);

        // Map column names to indices
        $colMap = array_flip($headers);

        $requiredCols = ["\xD1\x81\xD1\x87\xD0\xB5\xD1\x82", "\xD0\x94\xD0\xB0\xD1\x82\xD0\xB0", "\xD0\xA1\xD1\x83\xD0\xBC\xD0\xBC\xD0\xB0"];
        // "счет", "Дата", "Сумма" — check at least these columns exist
        $accountCol     = $this->findCol($colMap, ["\xD1\x81\xD1\x87\xD0\xB5\xD1\x82", 'account', "\xD0\xA1\xD1\x87\xD0\xB5\xD1\x82"]);
        $dateCol        = $this->findCol($colMap, ["\xD0\x94\xD0\xB0\xD1\x82\xD0\xB0", 'date', 'Date']);
        $amountCol      = $this->findCol($colMap, ["\xD0\xA1\xD1\x83\xD0\xBC\xD0\xBC\xD0\xB0", 'amount', 'Amount']);
        $payeeCol       = $this->findCol($colMap, ["\xD0\x9A\xD0\xBE\xD0\xBD\xD1\x82\xD1\x80\xD0\xB0\xD0\xB3\xD0\xB5\xD0\xBD\xD1\x82", 'payee', 'Payee']);
        $categoryCol    = $this->findCol($colMap, ["\xD0\x9A\xD0\xB0\xD1\x82\xD0\xB5\xD0\xB3\xD0\xBE\xD1\x80\xD0\xB8\xD1\x8F", 'category', 'Category']);
        $descCol        = $this->findCol($colMap, ["\xD0\x9E\xD0\xBF\xD0\xB8\xD1\x81\xD0\xB0\xD0\xBD\xD0\xB8\xD0\xB5", 'description', 'Description', "\xD0\x9F\xD1\x80\xD0\xB8\xD0\xBC\xD0\xB5\xD1\x87\xD0\xB0\xD0\xBD\xD0\xB8\xD0\xB5"]);
        $transferCol    = $this->findCol($colMap, ["\xD0\xA2\xD1\x80\xD0\xB0\xD0\xBD\xD1\x81\xD1\x84\xD0\xB5\xD1\x80\xD1\x8B", 'transfer', 'Transfer']);

        if ($accountCol === null || $dateCol === null || $amountCol === null) {
            return $this->failValidationErrors([
                'file' => 'CSV is missing required columns (account/date/amount). Found: ' . implode(', ', $headers),
            ]);
        }

        // --- Pre-load existing user data into cache ---
        $accountModel  = new AccountModel();
        $categoryModel = new CategoryModel();
        $payeeModel    = new PayeeModel();
        $txModel       = new TransactionModel();

        // accountCache: name (lowercase) => account object
        $accountCache = [];
        foreach ($accountModel->findByUserId($userId) as $acc) {
            $accountCache[mb_strtolower($acc->name)] = $acc;
        }

        // payeeCache: name (lowercase) => payee id
        $payeeCache = [];
        $allPayees  = $payeeModel->findAll();
        foreach ($allPayees as $p) {
            $payeeCache[mb_strtolower($p->name)] = $p->id;
        }

        // categoryCache: name (lowercase) => category object
        $categoryCache = [];
        foreach ($categoryModel->findByUserId($userId) as $cat) {
            $categoryCache[mb_strtolower($cat->name)] = $cat;
        }

        // --- Process rows inside a DB transaction ---
        $db = db_connect();
        $db->transStart();

        $imported         = 0;
        $skipped          = 0;
        $accountsCreated  = 0;
        $payeesCreated    = 0;
        $categoriesCreated = 0;

        foreach ($lines as $lineIndex => $line) {
            $line = trim($line);

            if ($line === '') {
                continue;
            }

            $row = str_getcsv($line);

            // Skip rows that are too short to contain required columns
            $maxNeeded = max(
                $accountCol,
                $dateCol,
                $amountCol,
                $payeeCol    ?? 0,
                $categoryCol ?? 0,
                $descCol     ?? 0,
                $transferCol ?? 0
            );

            if (count($row) <= $maxNeeded) {
                $skipped++;
                continue;
            }

            // --- Amount ---
            $rawAmount = trim($row[$amountCol]);

            if ($rawAmount === '') {
                $skipped++;
                continue;
            }

            // Normalize thousands/decimal separators.
            // American format "7,942.60": comma = thousands separator → remove it.
            // European format "7.942,60": dot = thousands separator → remove dots, comma → dot.
            $hasComma = str_contains($rawAmount, ',');
            $hasDot   = str_contains($rawAmount, '.');
            if ($hasComma && $hasDot) {
                // Whichever appears last is the decimal separator
                if (strrpos($rawAmount, '.') > strrpos($rawAmount, ',')) {
                    $rawAmount = str_replace(',', '', $rawAmount); // American: remove thousand-commas
                } else {
                    $rawAmount = str_replace('.', '', $rawAmount); // European: remove thousand-dots
                    $rawAmount = str_replace(',', '.', $rawAmount); // European: comma → decimal dot
                }
            } elseif ($hasComma) {
                $rawAmount = str_replace(',', '.', $rawAmount); // lone comma is decimal
            }
            $rawAmount = preg_replace('/[^0-9.\-]/', '', $rawAmount);
            $amount    = (float)$rawAmount;

            // --- Transaction type ---
            $rawTransfer = $transferCol !== null ? trim($row[$transferCol]) : '';
            $type        = $rawTransfer !== '' ? 'transfer' : ($amount < 0 ? 'expense' : 'income');
            $absAmount   = abs($amount);

            if ($absAmount == 0) {
                $skipped++;
                continue;
            }

            // --- Date ---
            $rawDate = trim($row[$dateCol]);
            $date    = $this->parseDate($rawDate);

            if ($date === null) {
                $skipped++;
                continue;
            }

            // --- Account ---
            $rawAccount  = trim($row[$accountCol]);
            $accountKey  = mb_strtolower($rawAccount);
            $accountId   = null;

            if ($rawAccount === '') {
                $skipped++;
                continue;
            }

            if (isset($accountCache[$accountKey])) {
                $accountId = $accountCache[$accountKey]->id;
            } else {
                $accountModel->insert([
                    'user_id' => $userId,
                    'name'    => $rawAccount,
                    'type'    => 'checking',
                    'balance' => 0,
                ]);
                // Fetch back using name to get the ID generated by the beforeInsert callback
                $newAcc = $accountModel->where('user_id', $userId)->where('name', $rawAccount)->first();
                if ($newAcc) {
                    $accountCache[$accountKey] = $newAcc;
                    $accountId = $newAcc->id;
                    $accountsCreated++;
                } else {
                    $skipped++;
                    continue;
                }
            }

            // --- Payee ---
            $payeeId  = null;
            $rawPayee = $payeeCol !== null ? trim($row[$payeeCol]) : '';

            if ($rawPayee !== '') {
                $payeeKey = mb_strtolower($rawPayee);

                if (isset($payeeCache[$payeeKey])) {
                    $payeeId = $payeeCache[$payeeKey];
                } else {
                    $payeeModel->insert([
                        'name'                => $rawPayee,
                        'created_by_user_id'  => $userId,
                        'usage_count'         => 1,
                    ]);
                    // Fetch back using name to get the ID generated by the beforeInsert callback
                    $newPayee = $payeeModel->where('name', $rawPayee)->first();
                    if ($newPayee) {
                        $payeeCache[$payeeKey] = $newPayee->id;
                        $payeeId = $newPayee->id;
                        $payeesCreated++;
                    }
                }
            }

            // --- Category ---
            $categoryId  = null;
            $rawCategory = $categoryCol !== null ? trim($row[$categoryCol]) : '';

            if ($rawCategory !== '') {
                $categoryType = ($type === 'income') ? 'income' : 'expense';

                // Check for "Parent ► Child" separator (UTF-8 right-pointing triangle: ►)
                if (mb_strpos($rawCategory, '►') !== false) {
                    [$parentName, $childName] = array_map('trim', explode('►', $rawCategory, 2));

                    // Find or create parent
                    $parentKey = mb_strtolower($parentName);
                    $parentId  = null;

                    if (isset($categoryCache[$parentKey]) && (bool)$categoryCache[$parentKey]->is_parent) {
                        $parentId = $categoryCache[$parentKey]->id;
                    } elseif (isset($categoryCache[$parentKey])) {
                        // Exists but not a parent — use as-is for the parent id lookup
                        $parentId = $categoryCache[$parentKey]->id;
                    } else {
                        $categoryModel->insert([
                            'user_id'   => $userId,
                            'name'      => $parentName,
                            'type'      => $categoryType,
                            'is_parent' => 1,
                        ]);
                        $newParent = $categoryModel->where('user_id', $userId)->where('name', $parentName)->first();
                        if ($newParent) {
                            $categoryCache[$parentKey] = $newParent;
                            $parentId = $newParent->id;
                            $categoriesCreated++;
                        }
                    }

                    // Find or create child
                    if ($parentId !== null) {
                        $childKey = mb_strtolower($childName);

                        if (isset($categoryCache[$childKey])) {
                            $categoryId = $categoryCache[$childKey]->id;
                        } else {
                            $categoryModel->insert([
                                'user_id'   => $userId,
                                'name'      => $childName,
                                'type'      => $categoryType,
                                'is_parent' => 0,
                                'parent_id' => $parentId,
                            ]);
                            $newChild = $categoryModel->where('user_id', $userId)->where('name', $childName)->first();
                            if ($newChild) {
                                $categoryCache[$childKey] = $newChild;
                                $categoryId = $newChild->id;
                                $categoriesCreated++;
                            }
                        }
                    }
                } else {
                    // Plain category name (no parent separator)
                    $catKey = mb_strtolower($rawCategory);

                    if (isset($categoryCache[$catKey])) {
                        $categoryId = $categoryCache[$catKey]->id;
                    } else {
                        $categoryModel->insert([
                            'user_id'   => $userId,
                            'name'      => $rawCategory,
                            'type'      => $categoryType,
                            'is_parent' => 0,
                        ]);
                        $newCat = $categoryModel->where('user_id', $userId)->where('name', $rawCategory)->first();
                        if ($newCat) {
                            $categoryCache[$catKey] = $newCat;
                            $categoryId = $newCat->id;
                            $categoriesCreated++;
                        }
                    }
                }
            }

            // --- Notes ---
            $notes = $descCol !== null ? trim($row[$descCol]) : '';
            $notes = $notes !== '' ? $notes : null;

            // --- Insert transaction ---
            $txModel->insert([
                'user_id'     => $userId,
                'account_id'  => $accountId,
                'payee_id'    => $payeeId,
                'category_id' => $categoryId,
                'amount'      => $absAmount,
                'type'        => $type,
                'date'        => $date,
                'notes'       => $notes,
            ]);

            $imported++;
        }

        $db->transComplete();

        if ($db->transStatus() === false) {
            log_message('error', 'ImportController::csv — DB transaction failed.');
            return $this->fail('Database error while importing transactions.', 500);
        }

        return $this->respond([
            'imported'           => $imported,
            'skipped'            => $skipped,
            'accounts_created'   => $accountsCreated,
            'payees_created'     => $payeesCreated,
            'categories_created' => $categoriesCreated,
        ]);
    }

    /**
     * Find the index of a column by trying multiple possible header names.
     * Returns null if none of the candidates are present.
     *
     * @param array  $colMap    Flipped headers array (name => index)
     * @param array  $candidates Possible column name variants to try
     * @return int|null
     */
    private function findCol(array $colMap, array $candidates): ?int
    {
        foreach ($candidates as $name) {
            if (isset($colMap[$name])) {
                return (int)$colMap[$name];
            }
        }
        return null;
    }

    /**
     * Parse a date string in MM/DD/YYYY format (or fallback common formats) into Y-m-d.
     * Returns null if the date cannot be parsed.
     *
     * @param string $raw
     * @return string|null
     */
    private function parseDate(string $raw): ?string
    {
        if ($raw === '') {
            return null;
        }

        // MM/DD/YYYY
        if (preg_match('#^(\d{1,2})/(\d{1,2})/(\d{4})$#', $raw, $m)) {
            $dt = \DateTime::createFromFormat('m/d/Y', sprintf('%02d/%02d/%04d', $m[1], $m[2], $m[3]));
            return $dt ? $dt->format('Y-m-d') : null;
        }

        // DD.MM.YYYY
        if (preg_match('#^(\d{1,2})\.(\d{1,2})\.(\d{4})$#', $raw, $m)) {
            $dt = \DateTime::createFromFormat('d.m.Y', sprintf('%02d.%02d.%04d', $m[1], $m[2], $m[3]));
            return $dt ? $dt->format('Y-m-d') : null;
        }

        // YYYY-MM-DD (already in correct format)
        if (preg_match('#^\d{4}-\d{2}-\d{2}$#', $raw)) {
            return $raw;
        }

        // Fallback: let PHP try to parse it
        $ts = strtotime($raw);
        return $ts !== false ? date('Y-m-d', $ts) : null;
    }
}
