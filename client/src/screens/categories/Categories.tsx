import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'
import { AppLayout, CategoriesTable, CategoryFormDialog } from '@/components'
import { useAppSelector } from '@/store/hooks'

export const Categories: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.categories', 'Categories')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const [openForm, setOpenForm] = useState(false)

    const {
        data: categories,
        isLoading,
        isFetching
    } = useListCategoriesQuery(
        activeGroupId
            ? { withSums: true, include_archived: 1, withChildren: true, group_id: activeGroupId }
            : { withSums: true, include_archived: 1, withChildren: true },
        { refetchOnReconnect: true, skip: !isAuth }
    )

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
            <CategoriesTable
                categories={categories ?? []}
                isLoading={isLoading}
                isFetching={isFetching}
                showHeader={true}
                defaultExpanded={true}
            />

            <CategoryFormDialog
                open={openForm}
                onCloseDialog={() => setOpenForm(false)}
            />
        </AppLayout>
    )
}
