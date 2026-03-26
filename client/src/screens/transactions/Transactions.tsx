import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { Badge, Button, Dialog, Message, Popout, Table } from 'simple-react-ui-kit'

import {
    ApiModel,
    useDeleteTransactionMutation,
    useListAccountQuery,
    useListCategoriesQuery,
    useListTransactionsQuery
} from '@/api'
import { AppLayout, ColorName, getColorHex } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatUTCDate } from '@/utils/dates'
import { Currency, formatMoney } from '@/utils/money'

import { TransactionForm } from './TransactionForm'

import styles from './styles.module.sass'

export const Transactions: React.FC = () => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth)

    const [searchParams, setSearchParams] = useSearchParams()
    const [search, setSearch] = useState(searchParams.get('search') ?? '')
    const [debouncedSearch, setDebouncedSearch] = useState(search)
    const [type, setType] = useState<'income' | 'expense' | ''>(
        (searchParams.get('type') as 'income' | 'expense') ?? ''
    )
    const [accountId, setAccountId] = useState(searchParams.get('account_id') ?? '')
    const [categoryId, setCategoryId] = useState(searchParams.get('category_id') ?? '')
    const [page, setPage] = useState(Number(searchParams.get('page') ?? 1))
    const [openForm, setOpenForm] = useState(false)
    const [editTransaction, setEditTransaction] = useState<ApiModel.Transaction | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Transaction | undefined>()

    const { data: accounts } = useListAccountQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })
    const { data: categories } = useListCategoriesQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

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
        if (page > 1) {
            params.page = String(page)
        }
        setSearchParams(params, { replace: true })
    }, [debouncedSearch, type, accountId, categoryId, page])

    const queryParams: ApiModel.TransactionListParams = {
        page,
        limit: 25,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(type && { type }),
        ...(accountId && { account_id: accountId }),
        ...(categoryId && { category_id: categoryId })
    }

    const { data: transactionData, isFetching } = useListTransactionsQuery(queryParams, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const transactions = transactionData?.data ?? []
    const meta = transactionData?.meta

    const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) {
            return
        }
        try {
            await deleteTransaction(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
        } catch (err) {
            console.error('Failed to delete transaction:', err)
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

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => {
                        setEditTransaction(undefined)
                        setOpenForm(true)
                    }}
                    label={t('transactions.add', 'Add Transaction')}
                />
            }
        >
            <div className={styles.filterBar}>
                <Button
                    mode={type === 'income' ? 'primary' : 'outline'}
                    label={t('transactions.income', 'Income')}
                    onClick={() => {
                        setType(type === 'income' ? '' : 'income')
                        setPage(1)
                    }}
                />
                <Button
                    mode={type === 'expense' ? 'primary' : 'outline'}
                    label={t('transactions.expense', 'Expense')}
                    onClick={() => {
                        setType(type === 'expense' ? '' : 'expense')
                        setPage(1)
                    }}
                />
                {accountOptions.length > 1 && (
                    <select
                        value={accountId}
                        onChange={(e) => {
                            setAccountId(e.target.value)
                            setPage(1)
                        }}
                    >
                        {accountOptions.map((opt) => (
                            <option
                                key={opt.key}
                                value={opt.key}
                            >
                                {opt.value}
                            </option>
                        ))}
                    </select>
                )}
                {categoryOptions.length > 1 && (
                    <select
                        value={categoryId}
                        onChange={(e) => {
                            setCategoryId(e.target.value)
                            setPage(1)
                        }}
                    >
                        {categoryOptions.map((opt) => (
                            <option
                                key={opt.key}
                                value={opt.key}
                            >
                                {opt.value}
                            </option>
                        ))}
                    </select>
                )}
                <input
                    type='text'
                    placeholder={t('transactions.search', 'Search transactions...')}
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                    }}
                />
            </div>

            <Table<ApiModel.Transaction>
                loading={isFetching}
                data={transactions}
                columns={[
                    {
                        header: t('transactions.date', 'Date'),
                        accessor: 'date',
                        formatter: (value) => formatUTCDate(value as string, 'DD.MM.YYYY')
                    },
                    {
                        header: t('transactions.payee', 'Payee'),
                        accessor: 'payee'
                    },
                    {
                        header: t('transactions.category', 'Category'),
                        accessor: 'category_id',
                        formatter: (value) => {
                            const category = categories?.find((cat) => cat.id === value)

                            if (!category) {
                                return t('transactions.noCategory', 'No category')
                            }

                            return (
                                <Badge
                                    size='small'
                                    icon={<>{category.icon}</>}
                                    key={category.id}
                                    label={category.name}
                                    style={{ backgroundColor: getColorHex(category?.color as ColorName) }}
                                />
                            )
                        }
                    },
                    {
                        header: t('transactions.account', 'Account'),
                        accessor: 'account_id',
                        formatter: (value) => accounts?.find((acc) => acc.id === value)?.name ?? ''
                    },
                    {
                        header: t('transactions.amount', 'Amount'),
                        accessor: 'amount',
                        formatter: (value, rows, index) => {
                            const row = rows[index]
                            const isIncome = row?.type === 'income'
                            return (
                                <span className={isIncome ? styles.positive : styles.negative}>
                                    {isIncome ? '+' : '-'}
                                    {formatMoney(value, Currency.USD)}
                                </span>
                            )
                        }
                    },
                    {
                        header: '',
                        accessor: 'id',
                        formatter: (_value, rows, index) => {
                            const row = rows[index]
                            return (
                                <Popout
                                    trigger={
                                        <Button
                                            mode='link'
                                            icon='VerticalDots'
                                        />
                                    }
                                    closeOnChildrenClick
                                >
                                    <Button
                                        mode='link'
                                        icon='Pencil'
                                        label={t('common.edit', 'Edit')}
                                        onClick={() => {
                                            setEditTransaction(row)
                                            setOpenForm(true)
                                        }}
                                    />
                                    <Button
                                        mode='link'
                                        icon='Close'
                                        variant='negative'
                                        label={t('transactions.delete', 'Delete')}
                                        onClick={() => setDeleteTarget(row)}
                                    />
                                </Popout>
                            )
                        }
                    }
                ]}
            />

            {meta && meta.pages > 1 && (
                <div className={styles.pagination}>
                    <span className={styles.paginationInfo}>
                        {t('transactions.showing', 'Showing')} {(page - 1) * 25 + 1}–{Math.min(page * 25, meta.total)}{' '}
                        {t('transactions.of', 'of')} {meta.total}
                    </span>
                    <Button
                        mode='outline'
                        label='←'
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    />
                    <Button
                        mode='outline'
                        label='→'
                        disabled={page >= meta.pages}
                        onClick={() => setPage((p) => p + 1)}
                    />
                </div>
            )}

            <TransactionForm
                open={openForm}
                transactionData={editTransaction}
                onCloseDialog={() => {
                    setOpenForm(false)
                    setEditTransaction(undefined)
                }}
            />

            <Dialog
                open={!!deleteTarget}
                title={t('transactions.deleteConfirmTitle', 'Delete transaction?')}
                onCloseDialog={() => setDeleteTarget(undefined)}
            >
                <Message type='warning'>
                    {t(
                        'transactions.deleteConfirmBody',
                        'This action cannot be undone. The account balance will be adjusted.'
                    )}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeleting ? '...' : t('transactions.delete', 'Delete')}
                    onClick={handleConfirmDelete}
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
        </AppLayout>
    )
}
