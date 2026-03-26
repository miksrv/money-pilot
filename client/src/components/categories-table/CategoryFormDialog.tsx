import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, Dialog, DialogProps, Input, Message, Select } from 'simple-react-ui-kit'

import {
    ApiModel,
    useAddCategoryMutation,
    useArchiveCategoryMutation,
    useDeleteCategoryMutation,
    useListCategoriesQuery,
    useUpdateCategoryMutation
} from '@/api'
import { ColorPicker, Currency, CurrencyInput, EmojiPicker } from '@/components'
import { useAppSelector } from '@/store/hooks'

import { DEFAULT_VALUES, NAME_MAX_LENGTH } from './constants'

import styles from './styles.module.sass'

interface CategoryFormDialogProps extends Partial<DialogProps> {
    categoryData?: ApiModel.Category
    onDelete?: (category: ApiModel.Category) => void
}

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = (props) => {
    const { t, i18n } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [blockedDelete, setBlockedDelete] = useState(false)
    const [isParent, setIsParent] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues
    } = useForm<ApiModel.Category>({
        defaultValues: DEFAULT_VALUES
    })

    const { data: allCategories } = useListCategoriesQuery({}, { skip: !isAuth })

    const [addCategory, { isLoading: isCreateLoading, error: createApiError, reset: createReset }] =
        useAddCategoryMutation()
    const [updateCategory, { isLoading: isUpdateLoading, error: updateApiError, reset: updateReset }] =
        useUpdateCategoryMutation()
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()
    const [archiveCategory, { isLoading: isArchiving }] = useArchiveCategoryMutation()

    const currentType = getValues('type')

    const parentOptions = (allCategories ?? [])
        .filter((cat) => cat.is_parent && cat.type === currentType && cat.id !== props.categoryData?.id)
        .map((cat) => ({ key: cat.id ?? '', value: cat.name ?? '' }))

    const onSubmit = async (data: ApiModel.Category) => {
        try {
            const payload: ApiModel.Category = {
                ...data,
                is_parent: isParent,
                icon: isParent ? undefined : data.icon,
                budget: isParent ? undefined : data.budget,
                parent_id: isParent ? undefined : data.parent_id
            }

            if (props?.categoryData?.id) {
                await updateCategory(payload).unwrap()
            } else {
                await addCategory(payload).unwrap()
            }

            props?.onCloseDialog?.()
            reset(DEFAULT_VALUES)
        } catch (err) {
            console.error('Failed to save category:', err)
        }
    }

    const handleDeleteClick = () => {
        if ((props.categoryData?.transaction_count ?? 0) > 0) {
            setBlockedDelete(true)
        } else {
            setShowDeleteConfirm(true)
        }
    }

    const handleConfirmDelete = async () => {
        if (!props.categoryData?.id) {
            return
        }
        try {
            await deleteCategory(props.categoryData.id).unwrap()
            setShowDeleteConfirm(false)
            props?.onCloseDialog?.()
            reset(DEFAULT_VALUES)
        } catch (err) {
            console.error('Failed to delete category:', err)
        }
    }

    const handleArchive = async () => {
        if (!props.categoryData?.id) {
            return
        }
        try {
            await archiveCategory({
                id: props.categoryData.id,
                archived: !props.categoryData.archived
            }).unwrap()
            props?.onCloseDialog?.()
            reset(DEFAULT_VALUES)
        } catch (err) {
            console.error('Failed to archive category:', err)
        }
    }

    useEffect(() => {
        if (props?.categoryData) {
            reset(props.categoryData)
            setIsParent(!!props.categoryData.is_parent)
        }
    }, [props?.categoryData])

    useEffect(() => {
        updateReset()
        createReset()
        setShowDeleteConfirm(false)
        setBlockedDelete(false)
        if (!props?.categoryData) {
            setIsParent(false)
        }
    }, [props.open])

    const isEditing = !!props?.categoryData?.id
    const isParentLocked = isEditing && !!props.categoryData?.is_parent

    return (
        <>
            <Dialog
                title={
                    isEditing
                        ? t('screens.categories.form.edit_title', 'Edit Category')
                        : t('screens.categories.form.create_title', 'Add Category')
                }
                open={props?.open}
                onCloseDialog={() => {
                    props?.onCloseDialog?.()
                    reset(DEFAULT_VALUES)
                }}
            >
                <form
                    className={styles.form}
                    onSubmit={handleSubmit(onSubmit)}
                >
                    {(createApiError || updateApiError) && (
                        <Message
                            type='error'
                            className={styles.errorMessage}
                        >
                            {t('common.errors.unknown', 'An unknown error occurred')}
                        </Message>
                    )}

                    <Checkbox
                        label={t('screens.categories.form.is_parent', 'Group category (parent)')}
                        checked={isParent}
                        disabled={isParentLocked}
                        onChange={(e) => setIsParent(e.target.checked)}
                    />

                    <div className={isParent ? styles.pickersParent : styles.pickers}>
                        {!isParent && (
                            <EmojiPicker
                                value={getValues('icon')}
                                onSelect={(icon) => {
                                    reset({ ...getValues(), icon })
                                }}
                            />
                        )}

                        <ColorPicker
                            value={getValues('color')}
                            onSelect={(color) => {
                                reset({ ...getValues(), color })
                            }}
                        />

                        <Input
                            id={'name'}
                            type={'text'}
                            size={'medium'}
                            error={errors?.name?.message}
                            className={styles.nameInput}
                            placeholder={t('screens.categories.form.name_placeholder', 'Category Name')}
                            {...register('name', {
                                required:
                                    t('screens.categories.form.name_placeholder', 'Category Name') +
                                    ' ' +
                                    t('common.errors.is-required', 'is required'),
                                maxLength: {
                                    value: NAME_MAX_LENGTH,
                                    message: t('common.errors.max-length', 'Max length is {{length}} characters', {
                                        length: NAME_MAX_LENGTH
                                    })
                                }
                            })}
                        />
                    </div>

                    <Select<string>
                        value={getValues('type')}
                        placeholder={t('screens.categories.form.type', 'Select type')}
                        options={[
                            { key: 'expense', value: t('categories.types.expense', 'Expense') },
                            { key: 'income', value: t('categories.types.income', 'Income') }
                        ]}
                        onSelect={(value) => {
                            reset({
                                ...getValues(),
                                type: value?.[0]?.key as 'income' | 'expense',
                                parent_id: undefined
                            })
                        }}
                    />

                    {!isParent && (
                        <>
                            {!!parentOptions.length && (
                                <Select<string>
                                    clearable
                                    value={getValues('parent_id') ?? undefined}
                                    placeholder={t('screens.categories.form.parent_group', 'Parent group (optional)')}
                                    options={parentOptions}
                                    onSelect={(items) => {
                                        reset({ ...getValues(), parent_id: items?.[0]?.key ?? undefined })
                                    }}
                                />
                            )}

                            <CurrencyInput
                                id={'budget'}
                                locale={i18n.language}
                                currency={Currency.USD}
                                value={getValues('budget')}
                                placeholder={t('screens.categories.form.budget_placeholder', 'Budget')}
                                onValueChange={(value) => {
                                    reset({ ...getValues(), budget: value || undefined })
                                }}
                            />
                        </>
                    )}

                    <Button
                        type='submit'
                        mode='primary'
                        stretched={true}
                        label={
                            isCreateLoading || isUpdateLoading
                                ? t('categories.save_button_loading', 'Loading...')
                                : t('categories.save_button', 'Save Category')
                        }
                        disabled={isCreateLoading || isUpdateLoading}
                    />

                    {isEditing && (
                        <div className={styles.actions}>
                            <Button
                                type='button'
                                mode='outline'
                                stretched={true}
                                label={
                                    isArchiving
                                        ? t('common.loading', 'Loading...')
                                        : props.categoryData?.archived
                                          ? t('categories.unarchiveCategory', 'Unarchive')
                                          : t('categories.archiveCategory', 'Archive')
                                }
                                disabled={isArchiving}
                                onClick={handleArchive}
                            />
                            <Button
                                type='button'
                                mode='outline'
                                variant='negative'
                                stretched={true}
                                icon='Close'
                                label={t('categories.deleteCategory', 'Delete')}
                                onClick={handleDeleteClick}
                            />
                        </div>
                    )}
                </form>
            </Dialog>

            {/* Confirm delete dialog */}
            <Dialog
                open={showDeleteConfirm}
                title={t('categories.deleteConfirmTitle', 'Delete category?')}
                onCloseDialog={() => setShowDeleteConfirm(false)}
            >
                <Message type='warning'>
                    {t('categories.deleteConfirmBody', 'This category will be permanently deleted.')}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeleting ? '...' : t('categories.deleteCategory', 'Delete')}
                    onClick={() => void handleConfirmDelete()}
                    disabled={isDeleting}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setShowDeleteConfirm(false)}
                    stretched
                />
            </Dialog>

            {/* Blocked delete dialog */}
            <Dialog
                open={blockedDelete}
                title={t('categories.deleteBlockedTitle', 'Cannot delete')}
                onCloseDialog={() => setBlockedDelete(false)}
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
                    onClick={() => setBlockedDelete(false)}
                    stretched
                />
            </Dialog>
        </>
    )
}
