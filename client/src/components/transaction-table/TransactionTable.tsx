import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'simple-react-ui-kit'

import { ApiModel, useListAccountQuery, useListCategoriesQuery, useUpdateTransactionMutation } from '@/api'
import { useAppSelector } from '@/store/hooks'

import { SKELETON_WIDTHS } from './constants'
import { DeleteTransactionDialog } from './DeleteTransactionDialog'
import { TransactionFormDialog } from './TransactionFormDialog'
import { TransactionRow } from './TransactionRow'
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
    onTransactionChange?: () => void
    openAddForm?: boolean
    onCloseAddForm?: () => void
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
    onTransactionChange,
    openAddForm,
    onCloseAddForm
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

    // Create lookup maps for O(1) access instead of O(n) find() calls
    const categoriesMap = useMemo(() => new Map(categories?.map((c) => [c.id, c]) ?? []), [categories])
    const accountsMap = useMemo(() => new Map(accounts?.map((a) => [a.id, a]) ?? []), [accounts])

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [editTransaction, setEditTransaction] = useState<ApiModel.Transaction | undefined>()
    const [openForm, setOpenForm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Transaction | undefined>()

    // Category picker state - single instance for all rows
    const [categoryPickerTransaction, setCategoryPickerTransaction] = useState<ApiModel.Transaction | null>(null)
    const [pickerPosition, setPickerPosition] = useState<{ top: number; left: number } | null>(null)
    const pickerRef = useRef<HTMLDivElement>(null)
    const [updateTransaction] = useUpdateTransactionMutation()

    const toggleSelect = useCallback(
        (id: string) => {
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
        },
        [onSelectionChange]
    )

    const handleRowClick = useCallback((transaction: ApiModel.Transaction) => {
        setEditTransaction(transaction)
        setOpenForm(true)
    }, [])

    const handleCloseForm = () => {
        setOpenForm(false)
        setEditTransaction(undefined)
        onCloseAddForm?.()
    }

    const handleDeleteComplete = () => {
        setDeleteTarget(undefined)
        handleCloseForm()
        onTransactionChange?.()
    }

    const handleCategoryPickerOpen = useCallback(
        (transaction: ApiModel.Transaction, triggerElement: HTMLButtonElement) => {
            const rect = triggerElement.getBoundingClientRect()
            setPickerPosition({
                top: rect.bottom + 4,
                left: rect.left
            })
            setCategoryPickerTransaction(transaction)
        },
        []
    )

    const handleCategoryPickerClose = useCallback(() => {
        setCategoryPickerTransaction(null)
        setPickerPosition(null)
    }, [])

    const handleCategorySelect = useCallback(
        (categoryId: string) => {
            if (!categoryPickerTransaction) {
                return
            }
            updateTransaction({ id: categoryPickerTransaction.id, category_id: categoryId })
                .unwrap()
                .then(() => onTransactionChange?.())
                .catch(() => {})
            handleCategoryPickerClose()
        },
        [categoryPickerTransaction, updateTransaction, onTransactionChange, handleCategoryPickerClose]
    )

    // Close picker on outside click
    useEffect(() => {
        if (!categoryPickerTransaction) {
            return
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                handleCategoryPickerClose()
            }
        }

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCategoryPickerClose()
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        document.addEventListener('keydown', handleEscape)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
            document.removeEventListener('keydown', handleEscape)
        }
    }, [categoryPickerTransaction, handleCategoryPickerClose])

    // Filter out parent categories for picker
    const selectableCategories = useMemo(
        () =>
            (categories ?? [])
                .filter((cat) => !cat.is_parent)
                .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')),
        [categories]
    )

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

    const showCheckbox = !isReadOnly && !hideCheckboxes

    const renderRow = (tx: ApiModel.Transaction) => (
        <TransactionRow
            key={tx.id}
            transaction={tx}
            category={categoriesMap.get(tx.category_id)}
            account={accountsMap.get(tx.account_id)}
            currency={currency}
            isSelected={selectedIds.has(tx.id)}
            isReadOnly={isReadOnly}
            showCheckbox={showCheckbox}
            onToggleSelect={toggleSelect}
            onRowClick={handleRowClick}
            onCategoryPickerOpen={handleCategoryPickerOpen}
        />
    )

    // Get current category for picker
    const pickerCurrentCategory = categoryPickerTransaction
        ? categoriesMap.get(categoryPickerTransaction.category_id)
        : null

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
                        <Skeleton style={{ height: 16, width: '80px', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: width + '%', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '18%', borderRadius: 4, marginLeft: 'auto' }} />
                    </div>
                ))}

            {!isLoading && !isFetching && transactions.length === 0 && (
                <div className={styles.emptyState}>{t('transactions.noResults', 'No transactions found')}</div>
            )}

            {/* Single CategoryPicker instance for all rows */}
            {!isReadOnly && categoryPickerTransaction && pickerPosition && (
                <div
                    ref={pickerRef}
                    className={styles.categoryPickerDropdown}
                    style={{
                        top: pickerPosition.top,
                        left: pickerPosition.left
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.categoryPicker}>
                        {selectableCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type='button'
                                className={[
                                    styles.categoryPickerItem,
                                    cat.id === pickerCurrentCategory?.id ? styles.categoryPickerItemActive : ''
                                ].join(' ')}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleCategorySelect(cat.id ?? '')
                                }}
                            >
                                <span className={styles.categoryPickerIcon}>{cat.icon}</span>
                                <span>{cat.name}</span>
                            </button>
                        ))}
                        {selectableCategories.length === 0 && (
                            <span className={styles.categoryPickerEmpty}>
                                {t('transactions.noCategories', 'No categories')}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Edit/Add form dialog */}
            <TransactionFormDialog
                open={openForm || !!openAddForm}
                transactionData={editTransaction}
                onCloseDialog={handleCloseForm}
                onTransactionSaved={onTransactionChange}
                onDelete={(tx) => {
                    setOpenForm(false)
                    setDeleteTarget(tx)
                }}
            />

            {/* Delete confirmation dialog */}
            <DeleteTransactionDialog
                transaction={deleteTarget}
                onClose={() => setDeleteTarget(undefined)}
                onDeleted={handleDeleteComplete}
            />
        </div>
    )
}
