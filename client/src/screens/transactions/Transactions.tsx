import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Button, Input, Select } from 'simple-react-ui-kit'

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
import { AppLayout, TransactionFormDialog, TransactionTable } from '@/components'
import { useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

export const Transactions: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.transactions', 'Transactions')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

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

    const resetList = () => {
        setPage(1)
        setAllTransactions([])
        setSelectedIds([])
    }

    const sentinelRef = useRef<HTMLDivElement>(null)

    const { data: accounts } = useListAccountQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })
    const { data: categories } = useListCategoriesQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

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
        setPage(1)
        setAllTransactions([])
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

    const { data: transactionData, isFetching } = useListTransactionsQuery(queryParams, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    // Accumulate pages
    useEffect(() => {
        if (!transactionData?.data) {
            return
        }
        setAllTransactions((prev) => (page === 1 ? transactionData.data : [...prev, ...transactionData.data]))
    }, [transactionData?.data])

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

    const accountOptions = [
        { key: '', value: t('transactions.filterByAccount', 'Account') },
        ...(accounts?.map((acc) => ({ key: acc.id ?? '', value: acc.name ?? '' })) ?? [])
    ]

    const categoryOptions = [
        { key: '', value: t('transactions.filterByCategory', 'Category') },
        ...(categories?.map((cat) => ({ key: cat.id ?? '', value: cat.name ?? '' })) ?? [])
    ]

    const addButton = !isViewer ? (
        <Button
            key='add'
            mode='secondary'
            icon='PlusCircle'
            onClick={() => {
                // TransactionTable handles its own form internally;
                // expose add via a standalone TransactionForm trigger kept in parent
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

    return (
        <AppLayout actions={actions.length > 0 ? actions : undefined}>
            <div className={styles.filterBar}>
                <Button
                    mode={type === 'income' ? 'primary' : 'outline'}
                    label={t('transactions.income', 'Income')}
                    onClick={() => setType(type === 'income' ? '' : 'income')}
                />
                <Button
                    mode={type === 'expense' ? 'primary' : 'outline'}
                    label={t('transactions.expense', 'Expense')}
                    onClick={() => setType(type === 'expense' ? '' : 'expense')}
                />
                {accountOptions.length > 1 && (
                    <Select<string>
                        options={accountOptions}
                        value={accountId}
                        onSelect={(items) => setAccountId(items?.[0]?.key ?? '')}
                    />
                )}
                {categoryOptions.length > 1 && (
                    <Select<string>
                        options={categoryOptions}
                        value={categoryId}
                        onSelect={(items) => setCategoryId(items?.[0]?.key ?? '')}
                    />
                )}
                <Input
                    id='transactions-search'
                    type='text'
                    size='medium'
                    placeholder={t('transactions.search', 'Search transactions...')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <TransactionTable
                transactions={allTransactions}
                currency={profile?.currency ?? 'USD'}
                isLoading={isFetching}
                onSelectionChange={setSelectedIds}
                isReadOnly={isViewer}
                onTransactionDeleted={resetList}
            />

            <div
                ref={sentinelRef}
                style={{ height: 1 }}
            />

            <TransactionFormDialog
                open={openAddForm}
                onCloseDialog={() => setOpenAddForm(false)}
            />
        </AppLayout>
    )
}
