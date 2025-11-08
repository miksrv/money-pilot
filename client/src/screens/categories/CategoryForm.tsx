import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogProps, Dropdown, Input, Message } from 'simple-react-ui-kit'

import { ApiModel, useAddCategoryMutation, useUpdateCategoryMutation } from '@/api'
import { ColorPicker, Currency, CurrencyInput, EmojiPicker } from '@/components'

import styles from './styles.module.sass'

interface CategoryFormProps extends Partial<DialogProps> {
    categoryData?: ApiModel.Category
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

export const CategoryForm: React.FC<CategoryFormProps> = (props) => {
    const { t, i18n } = useTranslation()

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
            console.error('Failed to add category:', err)
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
    }, [props.open])

    return (
        <Dialog
            title={
                props?.categoryData?.id
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
                        {createApiError?.error ||
                            updateApiError?.error ||
                            t('common.errors.unknown', 'An unknown error occurred')}
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

                <Dropdown<string>
                    value={getValues('type')}
                    mode={'secondary'}
                    placeholder={t('screens.categories.form.type', 'Select type')}
                    options={[
                        { key: 'expense', value: t('categories.types.expense', 'Expense') },
                        { key: 'income', value: t('categories.types.income', 'Income') }
                    ]}
                    onSelect={(value) => {
                        reset({ ...getValues(), type: value?.value as 'income' | 'expense' })
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
            </form>
        </Dialog>
    )
}
