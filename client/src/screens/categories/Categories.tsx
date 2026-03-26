import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Dialog, Message, Popout, Progress, Table } from 'simple-react-ui-kit'

import {
    ApiModel,
    useArchiveCategoryMutation,
    useDeleteCategoryMutation,
    useGetProfileQuery,
    useListCategoriesQuery
} from '@/api'
import { AppLayout, ColorName, getColorHex } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import { CategoryForm } from './CategoryForm'

import styles from './styles.module.sass'

export const Categories: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.categories', 'Categories')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })

    const [openForm, setOpenForm] = useState(false)
    const [categoryData, setCategoryData] = useState<ApiModel.Category | undefined>(undefined)
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Category | undefined>()
    const [blockedCategory, setBlockedCategory] = useState<ApiModel.Category | undefined>()
    const [isDeleting, setIsDeleting] = useState(false)

    const { data: categories } = useListCategoriesQuery(
        { withSums: true, include_archived: 1 },
        { refetchOnReconnect: true, skip: !isAuth }
    )

    const [deleteCategory] = useDeleteCategoryMutation()
    const [archiveCategory] = useArchiveCategoryMutation()

    const handleDeleteClick = (cat: ApiModel.Category) => {
        if ((cat.transaction_count ?? 0) > 0) {
            setBlockedCategory(cat)
        } else {
            setDeleteTarget(cat)
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) {
            return
        }
        setIsDeleting(true)
        try {
            await deleteCategory(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
        } catch (err) {
            console.error('Failed to delete category:', err)
        } finally {
            setIsDeleting(false)
        }
    }

    const handleArchive = async (cat: ApiModel.Category) => {
        if (!cat.id) {
            return
        }
        try {
            await archiveCategory({ id: cat.id, archived: !cat.archived }).unwrap()
        } catch (err) {
            console.error('Failed to archive category:', err)
        }
    }

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
                        formatter: (value, rows, index) => {
                            const cat = rows[index]
                            return (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        opacity: cat.archived ? 0.5 : 1
                                    }}
                                >
                                    <Badge
                                        label={value as string | undefined}
                                        size='small'
                                        icon={<>{cat.icon}</>}
                                        style={{ backgroundColor: getColorHex(cat?.color as ColorName) }}
                                        className={styles.categoryBadge}
                                        onClick={() => {
                                            setCategoryData(cat)
                                            setOpenForm(true)
                                        }}
                                    />
                                    {cat.archived && (
                                        <Badge
                                            label={t('categories.archived', 'Archived')}
                                            size='small'
                                        />
                                    )}
                                </div>
                            )
                        }
                    },
                    {
                        header: t('categories.expenses', 'Expenses'),
                        accessor: 'expenses',
                        formatter: (value) => formatMoney(value as number | undefined, profile?.currency ?? 'USD')
                    },
                    {
                        header: '',
                        accessor: 'icon',
                        formatter: (_value, rows, index) => {
                            const cat = rows[index]
                            const percentage = ((cat?.expenses ?? 0) / (cat?.budget || 1)) * 100

                            return cat?.budget ? (
                                <Progress
                                    value={percentage}
                                    color={percentage < 80 ? 'green' : percentage >= 95 ? 'red' : 'orange'}
                                />
                            ) : null
                        }
                    },
                    {
                        header: t('categories.budget', 'Budget'),
                        accessor: 'budget',
                        formatter: (value) =>
                            (value as number | undefined) !== 0
                                ? formatMoney(value as number | undefined, profile?.currency ?? 'USD')
                                : null
                    },
                    {
                        header: '',
                        accessor: 'id',
                        formatter: (_value, rows, index) => {
                            const cat = rows[index]
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
                                        label={t('categories.editCategory', 'Edit')}
                                        onClick={() => {
                                            setCategoryData(cat)
                                            setOpenForm(true)
                                        }}
                                    />
                                    <Button
                                        mode='link'
                                        label={
                                            cat.archived
                                                ? t('categories.unarchiveCategory', 'Unarchive')
                                                : t('categories.archiveCategory', 'Archive')
                                        }
                                        onClick={() => handleArchive(cat)}
                                    />
                                    <Button
                                        mode='link'
                                        icon='Close'
                                        variant='negative'
                                        label={t('categories.deleteCategory', 'Delete')}
                                        onClick={() => handleDeleteClick(cat)}
                                    />
                                </Popout>
                            )
                        }
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

            {/* Confirm delete dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('categories.deleteConfirmTitle', 'Delete category?')}
                onCloseDialog={() => setDeleteTarget(undefined)}
            >
                <Message type='warning'>
                    {t('categories.deleteConfirmBody', 'This category will be permanently deleted.')}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeleting ? '...' : t('categories.deleteCategory', 'Delete')}
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

            {/* Blocked delete dialog */}
            <Dialog
                open={!!blockedCategory}
                title={t('categories.deleteBlockedTitle', 'Cannot delete')}
                onCloseDialog={() => setBlockedCategory(undefined)}
            >
                <Message type='error'>
                    {t(
                        'categories.deleteBlockedBody',
                        'This category cannot be deleted because it is used by existing transactions.'
                    )}
                </Message>
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setBlockedCategory(undefined)}
                    stretched
                />
            </Dialog>
        </AppLayout>
    )
}
