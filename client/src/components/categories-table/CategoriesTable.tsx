import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Progress, Skeleton } from 'simple-react-ui-kit'

import { ApiModel, useGetProfileQuery } from '@/api'
import { FormattedMoney } from '@/components'
import { ColorName, getColorHex } from '@/components/color-picker'
import { useAppSelector } from '@/store/hooks'

import { CategoryFormDialog } from './CategoryFormDialog'
import { SKELETON_WIDTHS } from './constants'

import styles from './styles.module.sass'

interface CategoriesTableProps {
    categories: ApiModel.Category[]
    currency?: string
    isLoading?: boolean
    isFetching?: boolean
    showHeader?: boolean
    defaultExpanded?: boolean
}

interface CategoryGroup {
    parent: ApiModel.Category
    children: ApiModel.Category[]
}

export const CategoriesTable: React.FC<CategoriesTableProps> = ({
    categories,
    currency,
    isLoading,
    isFetching,
    showHeader = false,
    defaultExpanded = true
}) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })

    const effectiveCurrency = currency ?? profile?.currency ?? 'USD'

    const [editCategory, setEditCategory] = useState<ApiModel.Category | undefined>()
    const [openForm, setOpenForm] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

    const { groups, standalones } = useMemo(() => {
        const parentMap = new Map<string, ApiModel.Category>()
        const childrenMap = new Map<string, ApiModel.Category[]>()

        for (const cat of categories) {
            if (cat.is_parent && cat.id) {
                parentMap.set(cat.id, cat)
            }
        }

        for (const cat of categories) {
            if (!cat.is_parent && cat.parent_id && parentMap.has(cat.parent_id)) {
                const existing = childrenMap.get(cat.parent_id) ?? []
                childrenMap.set(cat.parent_id, [...existing, cat])
            }
        }

        const groupList: CategoryGroup[] = []
        for (const [id, parent] of parentMap.entries()) {
            groupList.push({ parent, children: childrenMap.get(id) ?? [] })
        }

        const standaloneList = categories.filter(
            (cat) => !cat.is_parent && (!cat.parent_id || !parentMap.has(cat.parent_id))
        )

        return { groups: groupList, standalones: standaloneList }
    }, [categories])

    const isGroupExpanded = (id: string): boolean => {
        if (id in expandedGroups) {
            return expandedGroups[id]
        }
        return defaultExpanded
    }

    const toggleGroup = (id: string) => {
        setExpandedGroups((prev) => ({ ...prev, [id]: !isGroupExpanded(id) }))
    }

    const handleRowClick = (category: ApiModel.Category) => {
        setEditCategory(category)
        setOpenForm(true)
    }

    const handleCloseForm = () => {
        setOpenForm(false)
        setEditCategory(undefined)
    }

    const renderChildRow = (cat: ApiModel.Category) => {
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
                <div className={styles.childCellName}>
                    <span
                        className={styles.colorDot}
                        style={{ backgroundColor: getColorHex(cat.color as ColorName) }}
                    />
                    {cat.icon && <span className={styles.categoryIcon}>{cat.icon}</span>}
                    <span className={styles.categoryName}>{cat.name}</span>
                </div>

                <div className={styles.cellExpenses}>
                    <span className={styles.expensesAmount}>
                        <FormattedMoney
                            amount={cat.expenses ?? 0}
                            currency={effectiveCurrency}
                        />
                    </span>
                </div>

                <div className={styles.cellProgress}>
                    {cat.budget ? (
                        <Progress
                            height={4}
                            value={percentage}
                            color={progressColor}
                        />
                    ) : null}
                </div>

                <div className={styles.cellBudget}>
                    {cat.budget ? (
                        <span className={styles.budgetAmount}>
                            <FormattedMoney
                                amount={cat.budget}
                                currency={effectiveCurrency}
                            />
                        </span>
                    ) : null}
                </div>
            </div>
        )
    }

    const renderParentGroup = (group: CategoryGroup) => {
        const { parent, children } = group
        const expanded = isGroupExpanded(parent.id ?? '')

        // Calculate totals from children
        const totalBudget = children.reduce((sum, child) => sum + (child.budget ?? 0), 0)
        const totalExpenses = children.reduce((sum, child) => sum + (child.expenses ?? 0), 0)
        const percentage = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0
        const progressColor = percentage < 80 ? 'green' : percentage >= 95 ? 'red' : 'orange'

        return (
            <React.Fragment key={parent.id}>
                <div
                    className={[styles.parentRow, parent.archived ? styles.rowArchived : ''].join(' ')}
                    onClick={() => {
                        if (children.length) {
                            toggleGroup(parent.id ?? '')
                        } else {
                            handleRowClick(parent)
                        }
                    }}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            if (children.length) {
                                toggleGroup(parent.id ?? '')
                            } else {
                                handleRowClick(parent)
                            }
                        }
                    }}
                >
                    <div className={styles.cellName}>
                        {children.length > 0 && <span className={styles.parentRowChevron}>{expanded ? '▼' : '▶'}</span>}
                        <span
                            className={styles.colorDot}
                            style={{ backgroundColor: getColorHex(parent.color as ColorName) }}
                        />
                        <span
                            className={styles.categoryName}
                            role='button'
                            tabIndex={0}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleRowClick(parent)
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation()
                                    handleRowClick(parent)
                                }
                            }}
                        >
                            {parent.name}
                        </span>
                    </div>

                    <div className={styles.cellExpenses}>
                        {totalExpenses > 0 && (
                            <span className={styles.expensesAmount}>
                                <FormattedMoney
                                    amount={totalExpenses}
                                    currency={effectiveCurrency}
                                />
                            </span>
                        )}
                    </div>

                    <div className={styles.cellProgress}>
                        {totalBudget > 0 ? (
                            <Progress
                                height={4}
                                value={percentage}
                                color={progressColor}
                            />
                        ) : null}
                    </div>

                    <div className={styles.cellBudget}>
                        {totalBudget > 0 ? (
                            <span className={styles.budgetAmount}>
                                <FormattedMoney
                                    amount={totalBudget}
                                    currency={effectiveCurrency}
                                />
                            </span>
                        ) : null}
                    </div>
                </div>

                {expanded && children.map(renderChildRow)}
            </React.Fragment>
        )
    }

    const renderStandaloneRow = (cat: ApiModel.Category) => {
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
                <div className={styles.cellName}>
                    <span
                        className={styles.colorDot}
                        style={{ backgroundColor: getColorHex(cat.color as ColorName) }}
                    />
                    {cat.icon && <span className={styles.categoryIcon}>{cat.icon}</span>}
                    <span className={styles.categoryName}>{cat.name}</span>
                </div>

                <div className={styles.cellExpenses}>
                    <span className={styles.expensesAmount}>
                        <FormattedMoney
                            amount={cat.expenses ?? 0}
                            currency={effectiveCurrency}
                        />
                    </span>
                </div>

                <div className={styles.cellProgress}>
                    {cat.budget ? (
                        <Progress
                            height={4}
                            value={percentage}
                            color={progressColor}
                        />
                    ) : null}
                </div>

                <div className={styles.cellBudget}>
                    {cat.budget ? (
                        <span className={styles.budgetAmount}>
                            <FormattedMoney
                                amount={cat.budget}
                                currency={effectiveCurrency}
                            />
                        </span>
                    ) : null}
                </div>
            </div>
        )
    }

    const isEmpty = !isLoading && !isFetching && categories.length === 0

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

            {groups.map(renderParentGroup)}
            {standalones.map(renderStandaloneRow)}

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

            {isEmpty && <div className={styles.emptyState}>{t('categories.noResults', 'No categories found')}</div>}

            <CategoryFormDialog
                open={openForm}
                categoryData={editCategory}
                onCloseDialog={handleCloseForm}
            />
        </div>
    )
}
