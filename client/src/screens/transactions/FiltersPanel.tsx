import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Select } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

interface FiltersPanelProps {
    search: string
    onSearchChange: (value: string) => void
    type: 'income' | 'expense' | ''
    onTypeChange: (value: 'income' | 'expense' | '') => void
    accountId: string
    onAccountIdChange: (value: string) => void
    categoryId: string
    onCategoryIdChange: (value: string) => void
    accountOptions: Array<{ key: string; value: string }>
    categoryOptions: Array<{ key: string; value: string }>
    onClearAll: () => void
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
    search,
    onSearchChange,
    type,
    onTypeChange,
    accountId,
    onAccountIdChange,
    categoryId,
    onCategoryIdChange,
    accountOptions,
    categoryOptions,
    onClearAll
}) => {
    const { t } = useTranslation()

    const activeFiltersCount = [type, accountId, categoryId, search].filter(Boolean).length

    return (
        <>
            <div className={styles.filterRow}>
                <div className={styles.typeButtons}>
                    <Button
                        mode={type === 'income' ? 'primary' : 'outline'}
                        label={t('transactions.income', 'Income')}
                        onClick={() => onTypeChange(type === 'income' ? '' : 'income')}
                    />
                    <Button
                        mode={type === 'expense' ? 'primary' : 'outline'}
                        label={t('transactions.expense', 'Expense')}
                        onClick={() => onTypeChange(type === 'expense' ? '' : 'expense')}
                    />
                </div>
            </div>

            <div className={styles.filterRow}>
                <Input
                    id='transactions-search'
                    type='text'
                    size='medium'
                    placeholder={t('transactions.searchPlaceholder', 'Search transactions...')}
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {accountOptions.length > 1 && (
                <div className={styles.filterRow}>
                    <Select<string>
                        options={accountOptions}
                        value={accountId}
                        placeholder={t('transactions.account', 'Account')}
                        onSelect={(items) => onAccountIdChange(items?.[0]?.key ?? '')}
                    />
                </div>
            )}

            {categoryOptions.length > 1 && (
                <div className={styles.filterRow}>
                    <Select<string>
                        options={categoryOptions}
                        value={categoryId}
                        placeholder={t('transactions.category', 'Category')}
                        onSelect={(items) => onCategoryIdChange(items?.[0]?.key ?? '')}
                    />
                </div>
            )}

            {activeFiltersCount > 0 && (
                <div className={styles.filterRow}>
                    <Button
                        mode='link'
                        label={t('transactions.clearFilters', 'Clear all filters')}
                        onClick={onClearAll}
                    />
                </div>
            )}
        </>
    )
}
