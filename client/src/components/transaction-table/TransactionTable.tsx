import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Dialog, Message, Skeleton } from 'simple-react-ui-kit'

import {
    ApiModel,
    useDeleteTransactionMutation,
    useListAccountQuery,
    useListCategoriesQuery,
    useUpdateTransactionMutation
} from '@/api'
import { CategoryPicker } from '@/components/category-picker'
import { ColorName, getColorHex } from '@/components/color-picker'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import { SKELETON_WIDTHS } from './constants'
import { TransactionFormDialog } from './TransactionFormDialog'
import { getDateLabel } from './utils'

import styles from './styles.module.sass'

interface TransactionTableProps {
    transactions: ApiModel.Transaction[]
    currency: string
    isLoading?: boolean
    isFetching?: boolean
    onSelectionChange?: (ids: string[]) => void
    isReadOnly?: boolean
    hideGrouping?: boolean
    hideCheckboxes?: boolean
    onTransactionDeleted?: () => void
    onTransactionUpdated?: () => void
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    currency,
    isLoading,
    isFetching,
    onSelectionChange,
    isReadOnly,
    hideGrouping,
    hideCheckboxes,
    onTransactionDeleted,
    onTransactionUpdated
}) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const { data: categories } = useListCategoriesQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
        skip: !isAuth
    })
    const { data: accounts } = useListAccountQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
        skip: !isAuth
    })

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [editTransaction, setEditTransaction] = useState<ApiModel.Transaction | undefined>()
    const [openForm, setOpenForm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Transaction | undefined>()
    const [deleteError, setDeleteError] = useState(false)

    const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()
    const [updateTransaction] = useUpdateTransactionMutation()

    const toggleSelect = (id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            onSelectionChange?.(Array.from(next))
            return next
        })
    }

    const handleRowClick = (transaction: ApiModel.Transaction) => {
        setEditTransaction(transaction)
        setOpenForm(true)
    }

    const handleCloseForm = () => {
        setOpenForm(false)
        setEditTransaction(undefined)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget?.id) {
            return
        }
        setDeleteError(false)
        try {
            await deleteTransaction(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
            handleCloseForm()
            onTransactionDeleted?.()
        } catch {
            setDeleteError(true)
        }
    }

    // Group transactions by date, sort groups descending
    const grouped = transactions.reduce<Record<string, ApiModel.Transaction[]>>((acc, tx) => {
        const key = tx.date
        if (!acc[key]) {
            acc[key] = []
        }
        acc[key].push(tx)
        return acc
    }, {})

    const sortedDates = Object.keys(grouped).sort((a, b) => (a < b ? 1 : -1))

    for (const date of sortedDates) {
        grouped[date].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    }

    // Flat list for hideGrouping mode
    const flatTransactions = hideGrouping ? sortedDates.flatMap((date) => grouped[date]) : []

    const renderRow = (tx: ApiModel.Transaction) => {
        const category = categories?.find((c) => c.id === tx.category_id)
        const account = accounts?.find((a) => a.id === tx.account_id)
        const isIncome = tx.type === 'income'
        const isSelected = selectedIds.has(tx.id)

        const showCheckbox = !isReadOnly && !hideCheckboxes

        return (
            <div
                key={tx.id}
                className={[styles.row, isSelected ? styles.rowSelected : ''].join(' ')}
                onClick={() => !isReadOnly && handleRowClick(tx)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                    if (!isReadOnly && (e.key === 'Enter' || e.key === ' ')) {
                        handleRowClick(tx)
                    }
                }}
            >
                {/* Cell 1: checkbox + payee + account */}
                <div className={styles.cellPayee}>
                    {showCheckbox && (
                        <div
                            className={styles.checkboxWrapper}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Checkbox
                                className={styles.checkbox}
                                checked={isSelected}
                                onChange={() => toggleSelect(tx.id)}
                            />
                        </div>
                    )}
                    <div className={styles.payeeInfo}>
                        <span className={styles.payeeName}>{tx.payee ?? '—'}</span>
                        {account && <span className={styles.accountName}>{account.name}</span>}
                    </div>
                </div>

                {/* Cell 2: category badge with picker */}
                <div
                    className={styles.cellCategory}
                    onClick={(e) => e.stopPropagation()}
                >
                    {!isReadOnly ? (
                        <CategoryPicker
                            currentCategoryId={tx.category_id}
                            onSelect={(categoryId) => {
                                updateTransaction({ id: tx.id, category_id: categoryId })
                                    .unwrap()
                                    .then(() => onTransactionUpdated?.())
                                    .catch(() => {})
                            }}
                            trigger={
                                category ? (
                                    <button
                                        type='button'
                                        className={styles.categoryBadge}
                                        style={{
                                            backgroundColor: getColorHex(category.color as ColorName) + '26',
                                            color: getColorHex(category.color as ColorName)
                                        }}
                                        aria-label={t('transactions.changeCategory', 'Change category')}
                                    >
                                        <span className={styles.categoryIcon}>{category.icon}</span>
                                        <span>{category.name}</span>
                                    </button>
                                ) : (
                                    <button
                                        type='button'
                                        className={styles.categoryBadgeEmpty}
                                        aria-label={t('transactions.changeCategory', 'Change category')}
                                    >
                                        {t('transactions.noCategory', 'No category')}
                                    </button>
                                )
                            }
                        />
                    ) : category ? (
                        <span
                            className={styles.categoryBadge}
                            style={{
                                backgroundColor: getColorHex(category.color as ColorName) + '26',
                                color: getColorHex(category.color as ColorName)
                            }}
                        >
                            <span className={styles.categoryIcon}>{category.icon}</span>
                            <span>{category.name}</span>
                        </span>
                    ) : (
                        <span className={styles.categoryBadgeEmpty}>{t('transactions.noCategory', 'No category')}</span>
                    )}
                </div>

                {/* Cell 3: amount */}
                <div className={styles.cellAmount}>
                    <span className={isIncome ? styles.amountIncome : styles.amountExpense}>
                        {formatMoney(Math.abs(tx.amount), currency)}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.tableWrapper}>
            {hideGrouping
                ? flatTransactions.map(renderRow)
                : sortedDates.map((date) => (
                      <div key={date}>
                          <div className={styles.dateHeader}>{getDateLabel(date, t)}</div>
                          {grouped[date].map(renderRow)}
                      </div>
                  ))}

            {isLoading &&
                SKELETON_WIDTHS.map((width, i) => (
                    <div
                        key={i}
                        className={styles.skeletonRow}
                    >
                        <Skeleton style={{ height: 16, width: '32px', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: width + '%', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '18%', borderRadius: 4, marginLeft: 'auto' }} />
                    </div>
                ))}

            {!isLoading && !isFetching && transactions.length === 0 && (
                <div className={styles.emptyState}>{t('transactions.noResults', 'No transactions found')}</div>
            )}

            {/* Edit form dialog */}
            <TransactionFormDialog
                open={openForm}
                transactionData={editTransaction}
                onCloseDialog={handleCloseForm}
                onTransactionSaved={onTransactionDeleted}
                onDelete={(tx) => {
                    setOpenForm(false)
                    setDeleteTarget(tx)
                }}
            />

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('transactions.deleteConfirmTitle', 'Delete transaction?')}
                onCloseDialog={() => {
                    setDeleteTarget(undefined)
                    setDeleteError(false)
                }}
            >
                <Message type='warning'>
                    {t('transactions.confirmDelete', 'Are you sure you want to delete this transaction?')}
                </Message>
                {deleteError && (
                    <Message type='error'>{t('common.errors.unknown', 'An unknown error occurred')}</Message>
                )}
                <Button
                    mode='primary'
                    variant='negative'
                    label={
                        isDeleting
                            ? t('common.loading', 'Loading...')
                            : t('transactions.deleteTransaction', 'Delete Transaction')
                    }
                    onClick={() => void handleDeleteConfirm()}
                    disabled={isDeleting}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setDeleteTarget(undefined)}
                    stretched
                />
            </Dialog>
        </div>
    )
}
