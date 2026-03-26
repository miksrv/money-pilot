import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Dialog, Message, Skeleton } from 'simple-react-ui-kit'

import {
    ApiModel,
    useDeleteRecurringMutation,
    useGenerateRecurringMutation,
    useListAccountQuery,
    useListCategoriesQuery,
    useToggleRecurringMutation,
    useUpdateRecurringMutation
} from '@/api'
import { CategoryPicker } from '@/components/category-picker'
import { ColorName, getColorHex } from '@/components/color-picker'
import { Currency } from '@/components/currency-input'
import { useAppSelector } from '@/store/hooks'
import { formatDate } from '@/utils/dates'
import { formatMoney } from '@/utils/money'

import { RecurringFormDialog } from './RecurringFormDialog'

import styles from './styles.module.sass'

interface RecurringTableProps {
    items: ApiModel.RecurringTransaction[]
    isLoading?: boolean
}

const SKELETON_WIDTHS = [80, 60, 70, 55, 65]

export const RecurringTable: React.FC<RecurringTableProps> = ({ items, isLoading }) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: categories } = useListCategoriesQuery(undefined, { skip: !isAuth })
    const { data: accounts } = useListAccountQuery(undefined, { skip: !isAuth })

    const [editItem, setEditItem] = useState<ApiModel.RecurringTransaction | undefined>()
    const [openForm, setOpenForm] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.RecurringTransaction | undefined>()
    const [deleteError, setDeleteError] = useState(false)

    const [deleteRecurring, { isLoading: isDeleting }] = useDeleteRecurringMutation()
    const [generateRecurring] = useGenerateRecurringMutation()
    const [toggleRecurring] = useToggleRecurringMutation()
    const [updateRecurring] = useUpdateRecurringMutation()

    const today = new Date().toISOString().split('T')[0]
    const isOverdue = (nextDue: string) => nextDue < today

    const handleRowClick = (item: ApiModel.RecurringTransaction) => {
        setEditItem(item)
        setOpenForm(true)
    }

    const handleCloseForm = () => {
        setOpenForm(false)
        setEditItem(undefined)
    }

    const handleDeleteConfirm = async () => {
        if (!deleteTarget?.id) {
            return
        }
        setDeleteError(false)
        try {
            await deleteRecurring(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
            handleCloseForm()
        } catch {
            setDeleteError(true)
        }
    }

    const handleGenerate = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await generateRecurring(id).unwrap()
        } catch {
            // silent
        }
    }

    const handleToggle = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await toggleRecurring(id).unwrap()
        } catch {
            // silent
        }
    }

    const renderRow = (item: ApiModel.RecurringTransaction) => {
        const category = categories?.find((c) => c.id === item.category_id)
        const account = accounts?.find((a) => a.id === item.account_id)
        const isIncome = item.type === 'income'
        const isPaused = item.is_active !== 1
        const overdue = isOverdue(item.next_due_date)

        return (
            <div
                key={item.id}
                className={[styles.row, isPaused ? styles.rowPaused : ''].join(' ')}
                onClick={() => handleRowClick(item)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleRowClick(item)
                    }
                }}
            >
                {/* Cell 1: Name + Payee + Account */}
                <div className={styles.cellName}>
                    <div className={styles.nameInfo}>
                        <span className={styles.itemName}>{item.name}</span>
                        <span className={styles.itemSubtitle}>
                            {item.payee_name && <span>{item.payee_name}</span>}
                            {item.payee_name && account && <span> · </span>}
                            {account && <span>{account.name}</span>}
                        </span>
                    </div>
                </div>

                {/* Cell 2: Category badge with picker */}
                <div
                    className={styles.cellCategory}
                    onClick={(e) => e.stopPropagation()}
                >
                    <CategoryPicker
                        currentCategoryId={item.category_id}
                        onSelect={(categoryId) => {
                            void updateRecurring({ id: item.id, category_id: categoryId })
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
                </div>

                {/* Cell 3: Frequency + Next Due */}
                <div className={styles.cellSchedule}>
                    <Badge
                        label={t('recurring.frequency.' + item.frequency, item.frequency)}
                        size='small'
                    />
                    <span className={[styles.nextDue, overdue ? styles.overdue : ''].join(' ')}>
                        {formatDate(item.next_due_date, 'DD.MM.YYYY')}
                    </span>
                </div>

                {/* Cell 4: Amount */}
                <div className={styles.cellAmount}>
                    <span className={isIncome ? styles.amountIncome : styles.amountExpense}>
                        {isIncome ? '+' : '-'}
                        {formatMoney(item.amount, Currency.USD)}
                    </span>
                </div>

                {/* Cell 5: Status + Quick actions */}
                <div
                    className={styles.cellStatus}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        mode='link'
                        size='small'
                        title={t('recurring.generateNow', 'Generate Now')}
                        icon='ArrowUp'
                        onClick={(e) => handleGenerate(item.id, e)}
                    />
                    <Button
                        mode='link'
                        size='small'
                        title={isPaused ? t('recurring.activate', 'Activate') : t('recurring.pause', 'Pause')}
                        // icon={isPaused ? 'Play' : 'Pause'}
                        onClick={(e) => handleToggle(item.id, e)}
                    >
                        {isPaused ? 'Play' : 'Pause'}
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.tableWrapper}>
            {items.map(renderRow)}

            {isLoading &&
                SKELETON_WIDTHS.map((width, i) => (
                    <div
                        key={i}
                        className={styles.skeletonRow}
                    >
                        <Skeleton style={{ height: 16, width: width + '%', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '15%', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '18%', borderRadius: 4, marginLeft: 'auto' }} />
                    </div>
                ))}

            {!isLoading && items.length === 0 && (
                <div className={styles.emptyState}>{t('recurring.noRecurring', 'No recurring transactions')}</div>
            )}

            {/* Edit form dialog */}
            <RecurringFormDialog
                open={openForm}
                recurringData={editItem}
                onCloseDialog={handleCloseForm}
                onDelete={(item) => {
                    setOpenForm(false)
                    setDeleteTarget(item)
                }}
            />

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('recurring.deleteConfirmTitle', 'Delete Recurring Transaction')}
                onCloseDialog={() => {
                    setDeleteTarget(undefined)
                    setDeleteError(false)
                }}
            >
                <Message type='warning'>
                    {t('recurring.deleteConfirmBody', 'Are you sure you want to delete this recurring transaction?')}
                </Message>
                {deleteError && (
                    <Message type='error'>{t('common.errors.unknown', 'An unknown error occurred')}</Message>
                )}
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeleting ? t('common.loading', 'Loading...') : t('common.delete', 'Delete')}
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
