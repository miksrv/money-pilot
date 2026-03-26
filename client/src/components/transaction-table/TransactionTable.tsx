import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Button, Checkbox, Dialog, Message, Skeleton } from 'simple-react-ui-kit'

import {
    ApiModel,
    useDeleteTransactionMutation,
    useListAccountQuery,
    useListCategoriesQuery,
    useUpdateTransactionMutation
} from '@/api'
import { ColorName, getColorHex } from '@/components/color-picker'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import { TransactionFormDialog } from './TransactionFormDialog'

import styles from './styles.module.sass'

interface TransactionTableProps {
    transactions: ApiModel.Transaction[]
    currency: string
    isLoading?: boolean
    onSelectionChange?: (ids: string[]) => void
    isReadOnly?: boolean
    hideGrouping?: boolean
    hideCheckboxes?: boolean
}

function getDateLabel(dateStr: string, t: ReturnType<typeof useTranslation>['t']): string {
    const today = dayjs().format('YYYY-MM-DD')
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    if (dateStr === today) {
        return t('transactions.today', 'TODAY')
    }
    if (dateStr === yesterday) {
        return t('transactions.yesterday', 'YESTERDAY')
    }
    return dayjs(dateStr).format('dddd, MMMM D').toUpperCase()
}

interface CategoryPickerProps {
    transactionId: string
    currentCategoryId?: string
    onClose: () => void
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ transactionId, currentCategoryId, onClose }) => {
    const { t } = useTranslation()
    const containerRef = useRef<HTMLDivElement>(null)
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: categories } = useListCategoriesQuery(undefined, { skip: !isAuth })
    const [updateTransaction] = useUpdateTransactionMutation()

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleMouseDown)
        return () => document.removeEventListener('mousedown', handleMouseDown)
    }, [onClose])

    const handleSelect = async (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await updateTransaction({ id: transactionId, category_id: categoryId }).unwrap()
        } catch {
            console.error('Failed to update category')
        }
        onClose()
    }

    return (
        <div
            ref={containerRef}
            className={styles.categoryPicker}
            onClick={(e) => e.stopPropagation()}
        >
            {(categories ?? []).map((cat) => (
                <button
                    key={cat.id}
                    type='button'
                    className={[
                        styles.categoryPickerItem,
                        cat.id === currentCategoryId ? styles.categoryPickerItemActive : ''
                    ].join(' ')}
                    onClick={(e) => void handleSelect(cat.id ?? '', e)}
                >
                    <span className={styles.categoryPickerIcon}>{cat.icon}</span>
                    <span>{cat.name}</span>
                </button>
            ))}
            {(!categories || categories.length === 0) && (
                <span className={styles.categoryPickerEmpty}>{t('transactions.noCategory', 'No category')}</span>
            )}
        </div>
    )
}

const SKELETON_WIDTHS = [80, 60, 70, 55, 65]

export const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    currency,
    isLoading,
    onSelectionChange,
    isReadOnly,
    hideGrouping,
    hideCheckboxes
}) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: categories } = useListCategoriesQuery(undefined, { skip: !isAuth })
    const { data: accounts } = useListAccountQuery(undefined, { skip: !isAuth })

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [editTransaction, setEditTransaction] = useState<ApiModel.Transaction | undefined>()
    const [openForm, setOpenForm] = useState(false)
    const [openPickerForId, setOpenPickerForId] = useState<string | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Transaction | undefined>()

    const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()

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
        try {
            await deleteTransaction(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
            handleCloseForm()
        } catch {
            console.error('Failed to delete transaction')
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
        const isPickerOpen = openPickerForId === tx.id

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
                    style={{ position: 'relative' }}
                >
                    {category ? (
                        <button
                            type='button'
                            className={styles.categoryBadge}
                            style={{
                                backgroundColor: getColorHex(category.color as ColorName) + '26',
                                color: getColorHex(category.color as ColorName)
                            }}
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!isReadOnly) {
                                    setOpenPickerForId(isPickerOpen ? null : tx.id)
                                }
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
                            onClick={(e) => {
                                e.stopPropagation()
                                if (!isReadOnly) {
                                    setOpenPickerForId(isPickerOpen ? null : tx.id)
                                }
                            }}
                            aria-label={t('transactions.changeCategory', 'Change category')}
                        >
                            {t('transactions.noCategory', 'No category')}
                        </button>
                    )}
                    {isPickerOpen && !isReadOnly && (
                        <CategoryPicker
                            transactionId={tx.id}
                            currentCategoryId={tx.category_id}
                            onClose={() => setOpenPickerForId(null)}
                        />
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

            {!isLoading && transactions.length === 0 && (
                <div className={styles.emptyState}>{t('transactions.noResults', 'No transactions found')}</div>
            )}

            {/* Edit form dialog */}
            <TransactionFormDialog
                open={openForm}
                transactionData={editTransaction}
                onCloseDialog={handleCloseForm}
                onDelete={(tx) => {
                    setOpenForm(false)
                    setDeleteTarget(tx)
                }}
            />

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('transactions.deleteConfirmTitle', 'Delete transaction?')}
                onCloseDialog={() => setDeleteTarget(undefined)}
            >
                <Message type='warning'>
                    {t('transactions.confirmDelete', 'Are you sure you want to delete this transaction?')}
                </Message>
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
