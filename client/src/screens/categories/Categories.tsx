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
    const [editCategoryId, setEditCategoryId] = useState<string | undefined>(undefined)

    const { data: categories } = useListCategoriesQuery()

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => setOpenForm(true)}
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
                                key={row[index].id}
                                label={value}
                                size={'small'}
                                icon={<>{row[index].icon}</>}
                                style={{ backgroundColor: getColorHex(row[index]?.color as ColorName) }}
                                className={styles.categoryBadge}
                                onClick={() => {
                                    setEditCategoryId(row[index].id)
                                    setOpenForm(true)
                                }}
                            />
                        )
                    },
                    {
                        header: t('categories.type', 'Type'),
                        accessor: 'type',
                        formatter: (value) => value
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
                            <Progress value={Math.min(100, (row[index].expenses / row[index].budget) * 100)} />
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
                editCategoryData={categories?.find(({ id }) => id === editCategoryId)}
                onCloseDialog={() => {
                    setEditCategoryId(undefined)
                    setOpenForm(false)
                }}
            />
        </AppLayout>
    )
}
