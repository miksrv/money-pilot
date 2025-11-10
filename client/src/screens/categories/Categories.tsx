import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Progress, Table } from 'simple-react-ui-kit'

import { ApiModel, useListCategoriesQuery } from '@/api'
import { AppLayout, ColorName, getColorHex } from '@/components'
import { Currency, formatMoney } from '@/utils/money'

import { CategoryForm } from './CategoryForm'

import styles from './styles.module.sass'

export const Categories: React.FC = () => {
    const { t } = useTranslation()

    const [openForm, setOpenForm] = useState(false)
    const [categoryData, setCategoryData] = useState<ApiModel.Category | undefined>(undefined)

    const { data: categories } = useListCategoriesQuery()

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => {
                        setCategoryData(undefined)
                        setOpenForm(true)
                    }}
                    label={t('categories.add', 'Add Category')}
                />
            }
        >
            <Table<ApiModel.Category>
                data={categories}
                columns={[
                    {
                        header: t('categories.name', 'Name'),
                        accessor: 'name',
                        formatter: (value, row, index) => (
                            <Badge
                                label={value}
                                size={'small'}
                                icon={<>{row[index].icon}</>}
                                style={{ backgroundColor: getColorHex(row[index]?.color as ColorName) }}
                                className={styles.categoryBadge}
                                onClick={() => {
                                    setCategoryData(row[index])
                                    setOpenForm(true)
                                }}
                            />
                        )
                    },
                    {
                        header: t('categories.type', 'Type'),
                        accessor: 'type',
                        formatter: (value) =>
                            value === 'income' ? t('categories.income', 'Income') : t('categories.expense', 'Expense')
                    },
                    {
                        header: t('categories.expenses', 'Expenses'),
                        accessor: 'expenses',
                        formatter: (value) => formatMoney(value, Currency.USD)
                    },
                    {
                        header: '',
                        accessor: 'expenses',
                        formatter: (_value, row, index) => (
                            <Progress
                                value={Math.min(100, ((row[index]?.expenses ?? 0) / (row[index]?.budget || 1)) * 100)}
                            />
                        )
                    },
                    {
                        header: t('categories.budget', 'Budget'),
                        accessor: 'budget',
                        formatter: (value) => formatMoney(value, Currency.USD)
                    }
                ]}
            />

            <CategoryForm
                open={openForm}
                categoryData={categoryData}
                onCloseDialog={() => {
                    setCategoryData(undefined)
                    setOpenForm(false)
                }}
            />
        </AppLayout>
    )
}
