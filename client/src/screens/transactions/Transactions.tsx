import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Button, Icon } from 'simple-react-ui-kit'

import {
    ApiModel,
    useBulkDeleteTransactionsMutation,
    useGetGroupMembersQuery,
    useGetProfileQuery,
    useListAccountQuery,
    useListCategoriesQuery,
    useListGroupsQuery,
    useListTransactionsQuery
} from '@/api'
import { AppLayout, TransactionTable } from '@/components'
import { useAppSelector } from '@/store/hooks'

import { FiltersPanel } from './FiltersPanel'

import styles from './styles.module.sass'

export const Transactions: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.transactions', 'Transactions')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)
    const groupSyncVersion = useAppSelector((state) => state.auth.groupSyncVersion)

    const { data: groups } = useListGroupsQuery(undefined, { skip: !isAuth })
    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })
    const { data: groupMembers } = useGetGroupMembersQuery(activeGroupId ?? '', {
        skip: !isAuth || !activeGroupId
    })

    const activeGroup = activeGroupId ? (groups?.find((g) => g.id === activeGroupId) ?? null) : null
    const myMember = groupMembers?.find((m) => m.user_id === profile?.id)
    const isViewer = activeGroup
        ? activeGroup.owner_id !== profile?.id && (myMember?.role ?? 'viewer') === 'viewer'
        : false

    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') ?? '')
    const [debouncedSearch, setDebouncedSearch] = useState(search)
    const [type, setType] = useState<'income' | 'expense' | ''>(
        (searchParams.get('type') as 'income' | 'expense') ?? ''
    )
    const [accountId, setAccountId] = useState(searchParams.get('account_id') ?? '')
    const [categoryId, setCategoryId] = useState(searchParams.get('category_id') ?? '')

    const [page, setPage] = useState(1)
    const [allTransactions, setAllTransactions] = useState<ApiModel.Transaction[]>([])
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [openAddForm, setOpenAddForm] = useState(false)
    const [filtersExpanded, setFiltersExpanded] = useState(false)
    const listVersionRef = useRef(0)
    const expectedPageRef = useRef(1)

    const resetList = () => {
        listVersionRef.current += 1
        expectedPageRef.current = 1
        setPage(1)
        setSelectedIds([])
    }

    // Reset and refetch from page 1 when group sync detects remote changes
    useEffect(() => {
        if (groupSyncVersion > 0) {
            resetList()
        }
    }, [groupSyncVersion])

    const sentinelRef = useRef<HTMLDivElement>(null)

    const { data: accounts } = useListAccountQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })
    const { data: categories } = useListCategoriesQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    // Sync filters to URL (without page — no longer needed for navigation)
    useEffect(() => {
        const params: Record<string, string> = {}
        if (debouncedSearch) {
            params.search = debouncedSearch
        }
        if (type) {
            params.type = type
        }
        if (accountId) {
            params.account_id = accountId
        }
        if (categoryId) {
            params.category_id = categoryId
        }
        setSearchParams(params, { replace: true })
    }, [debouncedSearch, type, accountId, categoryId])

    // Reset accumulated list when filters change
    useEffect(() => {
        listVersionRef.current += 1
        expectedPageRef.current = 1
        setPage(1)
        setSelectedIds([])
    }, [debouncedSearch, type, accountId, categoryId])

    const queryParams: ApiModel.TransactionListParams = {
        page,
        limit: 20,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(type && { type }),
        ...(accountId && { account_id: accountId }),
        ...(categoryId && { category_id: categoryId }),
        ...(activeGroupId && { group_id: activeGroupId })
    }

    const {
        data: transactionData,
        isLoading: isTransactionsLoading,
        isFetching
    } = useListTransactionsQuery(queryParams, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    // Accumulate pages — page 1 always resets the list (handles filter changes and cache invalidation
    // refetches); higher pages are only accepted in sequence to prevent duplicates
    useEffect(() => {
        if (!transactionData?.data) {
            return
        }

        const responsePage = transactionData.meta?.page ?? 1

        if (responsePage === 1) {
            // Fresh load, filter change, or cache-invalidation refetch — always replace
            setAllTransactions(transactionData.data)
            setSelectedIds([])
            expectedPageRef.current = 2
        } else if (responsePage === expectedPageRef.current) {
            // Paginating — append only in-sequence pages
            setAllTransactions((prev) => {
                const existingIds = new Set(prev.map((t) => t.id))
                const newTransactions = transactionData.data.filter((t) => !existingIds.has(t.id))
                return [...prev, ...newTransactions]
            })
            expectedPageRef.current = responsePage + 1
        }
        // else: ignore out-of-sequence responses
    }, [transactionData])

    // IntersectionObserver for infinite scroll
    useEffect(() => {
        const el = sentinelRef.current
        if (!el) {
            return
        }
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (
                    entry.isIntersecting &&
                    !isFetching &&
                    transactionData?.meta &&
                    transactionData.meta.page < transactionData.meta.pages
                ) {
                    setPage((p) => p + 1)
                }
            },
            { threshold: 0.1 }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isFetching, transactionData?.meta])

    const [bulkDeleteTransactions, { isLoading: isBulkDeleting }] = useBulkDeleteTransactionsMutation()

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) {
            return
        }
        try {
            await bulkDeleteTransactions({ ids: selectedIds }).unwrap()
            resetList()
        } catch {
            console.error('Failed to bulk delete transactions')
        }
    }

    const accountOptions = accounts?.map((acc) => ({ key: acc.id ?? '', value: acc.name ?? '' })) ?? []
    const categoryOptions =
        categories
            ?.filter((cat) => !cat.is_parent)
            .map((cat) => ({ key: cat.id ?? '', value: cat.name ?? '', emoji: cat?.icon })) ?? []

    const addButton = !isViewer ? (
        <Button
            key='add'
            mode='secondary'
            icon='PlusCircle'
            onClick={() => {
                setOpenAddForm(true)
            }}
            label={t('transactions.add', 'Add Transaction')}
        />
    ) : undefined

    const bulkDeleteButton =
        selectedIds.length > 0 ? (
            <Button
                key='bulk-delete'
                mode='outline'
                label={t('transactions.deleteSelected', 'Delete selected ({{count}})', { count: selectedIds.length })}
                onClick={() => void handleBulkDelete()}
                disabled={isBulkDeleting}
            />
        ) : null

    const actions = [bulkDeleteButton, addButton].filter(Boolean) as React.ReactElement[]

    const activeFiltersCount = [type, accountId, categoryId, debouncedSearch].filter(Boolean).length

    const clearAllFilters = () => {
        setSearch('')
        setType('')
        setAccountId('')
        setCategoryId('')
    }

    return (
        <AppLayout actions={actions.length > 0 ? actions : undefined}>
            <div className={styles.pageLayout}>
                {/* Mobile filters toggle */}
                <div className={styles.mobileFiltersHeader}>
                    <button
                        className={styles.filtersToggle}
                        onClick={() => setFiltersExpanded(!filtersExpanded)}
                    >
                        <Icon name='BarChart' />
                        <span>{t('transactions.filters', 'Filters')}</span>
                        {activeFiltersCount > 0 && <span className={styles.filtersBadge}>{activeFiltersCount}</span>}
                        <Icon name={filtersExpanded ? 'ArrowUp' : 'ArrowDown'} />
                    </button>
                </div>

                {/* Mobile expandable filters */}
                {filtersExpanded && (
                    <div className={styles.mobileFiltersPanel}>
                        <FiltersPanel
                            type={type}
                            search={search}
                            accountId={accountId}
                            categoryId={categoryId}
                            accountOptions={accountOptions}
                            categoryOptions={categoryOptions}
                            onTypeChange={setType}
                            onSearchChange={setSearch}
                            onClearAll={clearAllFilters}
                            onCategoryIdChange={setCategoryId}
                            onAccountIdChange={setAccountId}
                        />
                    </div>
                )}

                <div className={styles.contentWrapper}>
                    {/* Transaction list */}
                    <div className={styles.transactionListContainer}>
                        <TransactionTable
                            transactions={allTransactions}
                            currency={profile?.currency ?? 'USD'}
                            isLoading={isTransactionsLoading}
                            isFetching={isFetching}
                            onSelectionChange={setSelectedIds}
                            isReadOnly={isViewer}
                            onTransactionChange={resetList}
                            openAddForm={openAddForm}
                            onCloseAddForm={() => setOpenAddForm(false)}
                        />
                        <div
                            ref={sentinelRef}
                            style={{ height: 1 }}
                        />
                    </div>

                    {/* Desktop sidebar filters */}
                    <aside className={styles.filtersSidebar}>
                        <FiltersPanel
                            search={search}
                            onSearchChange={setSearch}
                            type={type}
                            onTypeChange={setType}
                            accountId={accountId}
                            onAccountIdChange={setAccountId}
                            categoryId={categoryId}
                            onCategoryIdChange={setCategoryId}
                            onClearAll={clearAllFilters}
                            accountOptions={accountOptions}
                            categoryOptions={categoryOptions}
                        />
                    </aside>
                </div>
            </div>
        </AppLayout>
    )
}
