import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Progress, Skeleton } from 'simple-react-ui-kit'

import { ApiModel, useGetProfileQuery } from '@/api'
import { ColorName, getColorHex } from '@/components/color-picker'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import { CategoryFormDialog } from './CategoryFormDialog'

import styles from './styles.module.sass'

interface CategoriesTableProps {
    categories: ApiModel.Category[]
    currency?: string
    isLoading?: boolean
    showHeader?: boolean
}

const SKELETON_WIDTHS = [80, 60, 70, 55, 65]

export const CategoriesTable: React.FC<CategoriesTableProps> = ({
    categories,
    currency,
    isLoading,
    showHeader = false
}) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })

    const effectiveCurrency = currency ?? profile?.currency ?? 'USD'

    const [editCategory, setEditCategory] = useState<ApiModel.Category | undefined>()
    const [openForm, setOpenForm] = useState(false)

    const handleRowClick = (category: ApiModel.Category) => {
        setEditCategory(category)
        setOpenForm(true)
    }

    const handleCloseForm = () => {
        setOpenForm(false)
        setEditCategory(undefined)
    }

    const renderRow = (cat: ApiModel.Category) => {
        const percentage = cat.budget ? ((cat.expenses ?? 0) / cat.budget) * 100 : 0
        const progressColor = percentage < 80 ? 'green' : percentage >= 95 ? 'red' : 'orange'

        return (
            <div
                key={cat.id}
                className={[styles.row, cat.archived ? styles.rowArchived : ''].join(' ')}
                onClick={() => handleRowClick(cat)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleRowClick(cat)
                    }
                }}
            >
                {/* Cell 1: Color dot + icon + name */}
                <div className={styles.cellName}>
                    <span
                        className={styles.colorDot}
                        style={{ backgroundColor: getColorHex(cat.color as ColorName) }}
                    />
                    {cat.icon && <span className={styles.categoryIcon}>{cat.icon}</span>}
                    <span className={styles.categoryName}>{cat.name}</span>
                </div>

                {/* Cell 2: Expenses */}
                <div className={styles.cellExpenses}>
                    <span className={styles.expensesAmount}>{formatMoney(cat.expenses ?? 0, effectiveCurrency)}</span>
                </div>

                {/* Cell 3: Progress bar (if budget exists) */}
                <div className={styles.cellProgress}>
                    {cat.budget ? (
                        <Progress
                            height={4}
                            value={percentage}
                            color={progressColor}
                        />
                    ) : null}
                </div>

                {/* Cell 4: Budget (if exists) */}
                <div className={styles.cellBudget}>
                    {cat.budget ? (
                        <span className={styles.budgetAmount}>{formatMoney(cat.budget, effectiveCurrency)}</span>
                    ) : null}
                </div>
            </div>
        )
    }

    return (
        <div className={styles.tableWrapper}>
            {showHeader && (
                <div className={styles.header}>
                    <div className={styles.headerCellName}>{t('categories.name', 'Name')}</div>
                    <div className={styles.headerCellExpenses}>{t('categories.expenses', 'Expenses')}</div>
                    <div className={styles.headerCellProgress}></div>
                    <div className={styles.headerCellBudget}>{t('categories.budget', 'Budget')}</div>
                </div>
            )}

            {categories.map(renderRow)}

            {isLoading &&
                SKELETON_WIDTHS.map((width, i) => (
                    <div
                        key={i}
                        className={styles.skeletonRow}
                    >
                        <Skeleton style={{ height: 12, width: 12, borderRadius: '50%' }} />
                        <Skeleton style={{ height: 16, width: width + '%', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '18%', borderRadius: 4, marginLeft: 'auto' }} />
                    </div>
                ))}

            {!isLoading && categories.length === 0 && (
                <div className={styles.emptyState}>{t('categories.noResults', 'No categories found')}</div>
            )}

            {/* Edit form dialog */}
            <CategoryFormDialog
                open={openForm}
                categoryData={editCategory}
                onCloseDialog={handleCloseForm}
            />
        </div>
    )
}
