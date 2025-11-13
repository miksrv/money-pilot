import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Table } from 'simple-react-ui-kit'

import { ApiModel, useListAccountQuery, useListCategoriesQuery, useListTransactionsQuery } from '@/api'
import { AppLayout, ColorName, getColorHex } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatUTCDate } from '@/utils/dates'
import { Currency, formatMoney } from '@/utils/money'

import { TransactionForm } from './TransactionForm'

export const Transactions: React.FC = () => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth)

    const [openForm, setOpenForm] = useState(false)

    const { data: accounts } = useListAccountQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })
    const { data: transactions } = useListTransactionsQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })
    const { data: categories } = useListCategoriesQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => setOpenForm(true)}
                    label={t('transactions.add', 'Add Transaction')}
                />
            }
        >
            <Table<ApiModel.Transaction>
                data={transactions}
                columns={[
                    {
                        header: t('transactions.payee', 'Payee'),
                        accessor: 'payee'
                    },
                    {
                        header: t('transactions.account', 'Account'),
                        accessor: 'account_id',
                        formatter: (value) => accounts?.find((acc) => acc.id === value)?.name || ''
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
                                    size={'small'}
                                    icon={<>{category.icon}</>}
                                    key={category.id}
                                    label={category.name}
                                    style={{ backgroundColor: getColorHex(category?.color as ColorName) }}
                                />
                            )
                        }
                    },
                    {
                        header: t('transactions.date', 'Date'),
                        accessor: 'date',
                        formatter: (value) => formatUTCDate(value as string, 'DD.MM.YYYY')
                    },
                    {
                        header: t('transactions.amount', 'Amount'),
                        accessor: 'amount',
                        formatter: (value) => formatMoney(value, Currency.USD)
                    }
                ]}
            />

            <TransactionForm
                open={openForm}
                onCloseDialog={() => setOpenForm(false)}
            />
        </AppLayout>
    )
}
