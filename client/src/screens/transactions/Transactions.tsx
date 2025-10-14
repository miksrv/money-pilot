import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Table } from 'simple-react-ui-kit'

import { ApiModel, useListCategoriesQuery, useListTransactionsQuery } from '@/api'
import { AppLayout } from '@/components'

import { ColorName, getColorHex } from '../../components'
import { formatUTCDate } from '../../utils/dates'

import { TransactionForm } from './TransactionForm'

export const Transactions: React.FC = () => {
    const { t } = useTranslation()

    const [openForm, setOpenForm] = useState(false)

    const { data: transactions } = useListTransactionsQuery()
    const { data: categories } = useListCategoriesQuery()

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => setOpenForm(true)}
                    label={t('transactions.add', 'Добавить транзакцию')}
                />
            }
        >
            <Table<ApiModel.Transaction>
                data={transactions}
                columns={[
                    {
                        header: t('transactions.payee', 'Получатель'),
                        accessor: 'payee_id'
                    },
                    {
                        header: t('transactions.category', 'Категория'),
                        accessor: 'category_id',
                        formatter: (value) => {
                            const category = categories?.find((cat) => cat.id === value)

                            if (!category) {
                                return t('transactions.noCategory', 'Без категории')
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
                        header: t('transactions.date', 'Дата'),
                        accessor: 'date',
                        formatter: (value) => formatUTCDate(value as string, 'DD.MM.YYYY')
                    },
                    {
                        header: t('transactions.amount', 'Сумма'),
                        accessor: 'amount'
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
