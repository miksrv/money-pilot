import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Table } from 'simple-react-ui-kit'

import { ApiModel, useListCategoriesQuery } from '@/api'
import { AppLayout } from '@/components'

import { CategoryForm } from './CategoryForm'

export const Categories: React.FC = () => {
    const { t } = useTranslation()

    const [openForm, setOpenForm] = useState(false)

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
                            <>
                                {row[index].icon} {value}
                            </>
                        )
                    },
                    {
                        header: t('categories.type', 'Type'),
                        accessor: 'type',
                        formatter: (value) => value
                    }
                ]}
            />

            <CategoryForm
                open={openForm}
                onCloseDialog={() => setOpenForm(false)}
            />
        </AppLayout>
    )
}
