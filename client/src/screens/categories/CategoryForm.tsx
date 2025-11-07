import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogProps, Dropdown, Input } from 'simple-react-ui-kit'

import { ApiModel, useAddCategoryMutation } from '@/api'
import { ColorPicker, Currency, CurrencyInput, EmojiPicker } from '@/components'

import styles from './styles.module.sass'

export const CategoryForm: React.FC<Partial<DialogProps>> = (props) => {
    const { t, i18n } = useTranslation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues
    } = useForm<ApiModel.Category>({
        defaultValues: {
            name: '',
            type: 'expense',
            parent_id: undefined,
            budget: undefined,
            color: 'grey',
            icon: '💵'
        }
    })

    const [addCategory, { isLoading, error: apiError }] = useAddCategoryMutation()

    const onSubmit = async (data: ApiModel.Category) => {
        try {
            await addCategory(data).unwrap()
            props?.onCloseDialog?.()
            reset()
        } catch (err) {
            console.error('Failed to add category:', err)
        }
    }

    return (
        <Dialog
            title={t('screens.categories.form.title', 'Add Category')}
            open={props?.open}
            onCloseDialog={() => {
                props?.onCloseDialog?.()
                reset()
            }}
        >
            <form
                className={styles.form}
                onSubmit={handleSubmit(onSubmit)}
            >
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
                        className={styles.nameInput}
                        placeholder={t('screens.categories.form.name_placeholder', 'Category Name')}
                        {...register('name', {
                            required: t('categories.name') + ' ' + t('common.required'),
                            maxLength: {
                                value: 100,
                                message: t('categories.name.maxLength')
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
                    placeholder={t('screens.categories.form.budget_placeholder', 'Budget')}
                    onValueChange={(value) => {
                        reset({ ...getValues(), budget: value || undefined })
                    }}
                />

                {/*<div>*/}
                {/*    <label htmlFor='parent_id'>{t('categories.parent')}</label>*/}
                {/*    <Input*/}
                {/*        id='parent_id'*/}
                {/*        type='text'*/}
                {/*        size='medium'*/}
                {/*        placeholder={t('categories.parent')}*/}
                {/*        {...register('parent_id')}*/}
                {/*    />*/}
                {/*    {errors.parent_id && <p className='error'>{errors.parent_id.message}</p>}*/}
                {/*</div>*/}

                {apiError && <p className='error'>{apiError?.data?.messages?.error || t('categories.error')}</p>}

                <Button
                    type='submit'
                    mode='primary'
                    stretched={true}
                    label={isLoading ? '...' : t('categories.save_button', 'Save Category')}
                    disabled={isLoading}
                />
            </form>
        </Dialog>
    )
}
