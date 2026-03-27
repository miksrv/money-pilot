import React, { memo, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Checkbox } from 'simple-react-ui-kit'

import { ApiModel } from '@/api'
import { ColorName, getColorHex } from '@/components/color-picker'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

interface TransactionRowProps {
    transaction: ApiModel.Transaction
    category: ApiModel.Category | undefined
    account: ApiModel.Account | undefined
    currency: string
    isSelected: boolean
    isReadOnly?: boolean
    showCheckbox: boolean
    onToggleSelect: (id: string) => void
    onRowClick: (transaction: ApiModel.Transaction) => void
    onCategoryPickerOpen?: (transaction: ApiModel.Transaction, triggerElement: HTMLButtonElement) => void
}

export const TransactionRow: React.FC<TransactionRowProps> = memo(
    ({
        transaction,
        category,
        account,
        currency,
        isSelected,
        isReadOnly,
        showCheckbox,
        onToggleSelect,
        onRowClick,
        onCategoryPickerOpen
    }) => {
        const { t } = useTranslation()
        const categoryButtonRef = useRef<HTMLButtonElement>(null)

        const isIncome = transaction.type === 'income'

        const handleRowClick = useCallback(() => {
            if (!isReadOnly) {
                onRowClick(transaction)
            }
        }, [isReadOnly, onRowClick, transaction])

        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent) => {
                if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) {
                    onRowClick(transaction)
                }
            },
            [isReadOnly, onRowClick, transaction]
        )

        const handleCheckboxClick = useCallback((e: React.MouseEvent) => {
            e.stopPropagation()
        }, [])

        const handleToggleSelect = useCallback(() => {
            onToggleSelect(transaction.id)
        }, [onToggleSelect, transaction.id])

        const handleCategoryClick = useCallback(
            (e: React.MouseEvent) => {
                e.stopPropagation()
                if (categoryButtonRef.current && onCategoryPickerOpen) {
                    onCategoryPickerOpen(transaction, categoryButtonRef.current)
                }
            },
            [onCategoryPickerOpen, transaction]
        )

        return (
            <div
                tabIndex={0}
                role='button'
                className={[styles.row, isSelected ? styles.rowSelected : ''].join(' ')}
                onClick={handleRowClick}
                onKeyDown={handleKeyDown}
            >
                {/* Cell 1: checkbox + amount */}
                <div className={styles.cellAmount}>
                    {showCheckbox && (
                        <div
                            className={styles.checkboxWrapper}
                            onClick={handleCheckboxClick}
                        >
                            <Checkbox
                                className={styles.checkbox}
                                checked={isSelected}
                                onChange={handleToggleSelect}
                            />
                        </div>
                    )}

                    <span className={isIncome ? styles.amountIncome : styles.amountExpense}>
                        {formatMoney(Math.abs(transaction.amount), currency)}
                    </span>
                </div>

                {/* Cell 2: payee + account */}
                <div className={styles.cellPayee}>
                    <span className={styles.payeeName}>{transaction.payee ?? '—'}</span>
                    {account && <span className={styles.accountName}>{account.name}</span>}
                </div>

                {/* Cell 3: category badge */}
                <div className={styles.cellCategory}>
                    {!isReadOnly ? (
                        category ? (
                            <button
                                ref={categoryButtonRef}
                                type='button'
                                className={styles.categoryBadge}
                                style={{
                                    backgroundColor: getColorHex(category.color as ColorName) + '26',
                                    color: getColorHex(category.color as ColorName)
                                }}
                                aria-label={t('transactions.changeCategory', 'Change category')}
                                onClick={handleCategoryClick}
                            >
                                <span className={styles.categoryIcon}>{category.icon}</span>
                                <span className={styles.categoryName}>{category.name}</span>
                            </button>
                        ) : (
                            <button
                                ref={categoryButtonRef}
                                type='button'
                                className={styles.categoryBadgeEmpty}
                                aria-label={t('transactions.changeCategory', 'Change category')}
                                onClick={handleCategoryClick}
                            >
                                {t('transactions.noCategory', 'No category')}
                            </button>
                        )
                    ) : category ? (
                        <span
                            className={styles.categoryBadge}
                            style={{
                                backgroundColor: getColorHex(category.color as ColorName) + '26',
                                color: getColorHex(category.color as ColorName)
                            }}
                        >
                            <span className={styles.categoryIcon}>{category.icon}</span>
                            <span className={styles.categoryName}>{category.name}</span>
                        </span>
                    ) : (
                        <span className={styles.categoryBadgeEmpty}>{t('transactions.noCategory', 'No category')}</span>
                    )}
                </div>
            </div>
        )
    }
)
