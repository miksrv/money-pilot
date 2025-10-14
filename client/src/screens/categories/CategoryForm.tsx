import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogProps, Dropdown, Input } from 'simple-react-ui-kit'

import { ApiModel, useAddCategoryMutation } from '@/api'
import { ColorPicker, EmojiPicker } from '@/components'

import styles from './styles.module.sass'

type CategoryFormData = ApiModel.Category

export interface CategoryFormProps extends Partial<DialogProps> {}

export const CategoryForm: React.FC<CategoryFormProps> = (props) => {
    const { t } = useTranslation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues
    } = useForm<CategoryFormData>({
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

    const onSubmit = async (data: CategoryFormData) => {
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
            <form onSubmit={handleSubmit(onSubmit)}>
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

                {/*<div>*/}
                {/*    <label htmlFor='name'>{t('categories.name')}</label>*/}
                {/*    */}
                {/*    {errors.name && <p className='error'>{errors.name.message}</p>}*/}
                {/*</div>*/}
                <div>
                    <label htmlFor='type'>{t('categories.type')}</label>
                    <select
                        id='type'
                        {...register('type', {
                            required: t('categories.type') + ' ' + t('common.required')
                        })}
                        className='w-full rounded-md border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:outline-none'
                    >
                        <option value='income'>{t('categories.types.income')}</option>
                        <option value='expense'>{t('categories.types.expense')}</option>
                    </select>
                    {errors.type && <p className='error'>{errors.type.message}</p>}
                </div>
                <div>
                    <label htmlFor='parent_id'>{t('categories.parent')}</label>
                    <Input
                        id='parent_id'
                        type='text'
                        size='medium'
                        placeholder={t('categories.parent')}
                        {...register('parent_id')}
                    />
                    {errors.parent_id && <p className='error'>{errors.parent_id.message}</p>}
                </div>
                {apiError && <p className='error'>{apiError?.data?.messages?.error || t('categories.error')}</p>}
                <Button
                    style={{ width: '100%' }}
                    type='submit'
                    mode='primary'
                    label={isLoading ? '...' : t('categories.create')}
                    disabled={isLoading}
                />
            </form>
        </Dialog>
    )
}
