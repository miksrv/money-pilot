import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogProps, Input, Message, Select } from 'simple-react-ui-kit'

import {
    ApiModel,
    useAddCategoryMutation,
    useArchiveCategoryMutation,
    useDeleteCategoryMutation,
    useUpdateCategoryMutation
} from '@/api'
import { ColorPicker, Currency, CurrencyInput, EmojiPicker } from '@/components'

import styles from './styles.module.sass'

interface CategoryFormDialogProps extends Partial<DialogProps> {
    categoryData?: ApiModel.Category
    onDelete?: (category: ApiModel.Category) => void
}

const NAME_MAX_LENGTH = 100

const DEFAULT_VALUES: ApiModel.Category = {
    name: '',
    type: 'expense',
    parent_id: undefined,
    budget: undefined,
    color: 'grey',
    icon: '💵'
}

export const CategoryFormDialog: React.FC<CategoryFormDialogProps> = (props) => {
    const { t, i18n } = useTranslation()

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [blockedDelete, setBlockedDelete] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues
    } = useForm<ApiModel.Category>({
        defaultValues: DEFAULT_VALUES
    })

    const [addCategory, { isLoading: isCreateLoading, error: createApiError, reset: createReset }] =
        useAddCategoryMutation()
    const [updateCategory, { isLoading: isUpdateLoading, error: updateApiError, reset: updateReset }] =
        useUpdateCategoryMutation()
    const [deleteCategory, { isLoading: isDeleting }] = useDeleteCategoryMutation()
    const [archiveCategory, { isLoading: isArchiving }] = useArchiveCategoryMutation()

    const onSubmit = async (data: ApiModel.Category) => {
        try {
            if (props?.categoryData?.id) {
                await updateCategory(data).unwrap()
            } else {
                await addCategory(data).unwrap()
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
        }
    }, [props?.categoryData])

    useEffect(() => {
        updateReset()
        createReset()
        setShowDeleteConfirm(false)
        setBlockedDelete(false)
    }, [props.open])

    const isEditing = !!props?.categoryData?.id

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

                    <div className={styles.pickers}>
                        <EmojiPicker
                            value={getValues('icon')}
                            onSelect={(icon) => {
                                reset({ ...getValues(), icon })
                            }}
                        />

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
                            reset({ ...getValues(), type: value?.[0]?.value as 'income' | 'expense' })
                        }}
                    />

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
