import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Input } from 'simple-react-ui-kit'

import { ApiModel, useAddCategoryMutation, useListCategoriesQuery } from '@/api'
import { AppLayout, ColorPicker, EmojiPicker } from '@/components'

type CategoryFormData = ApiModel.Category

export const Categories: React.FC = () => {
    const { t } = useTranslation()
    const [openDialog, setOpenDialog] = useState(false)
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
            color: undefined,
            icon: undefined
        }
    })
    const [addCategory, { isLoading, error: apiError }] = useAddCategoryMutation()
    const { data: categories } = useListCategoriesQuery()

    const onSubmit = async (data: CategoryFormData) => {
        try {
            await addCategory(data).unwrap()
            setOpenDialog(false)
            reset()
        } catch (err) {
            console.error('Failed to add category:', err)
        }
    }

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => setOpenDialog(true)}
                    label={t('categories.add')}
                />
            }
        >
            <h2>{t('categories.title')}</h2>

            {categories?.map((category) => (
                <div
                    key={category.id}
                    style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: 'var(--surface)'
                    }}
                >
                    <h3>{category.name}</h3>
                    <p>
                        {t('categories.type')}: {t(`categories.types.${category.type}`)}
                    </p>
                    {category.icon && (
                        <p>
                            {t('categories.icon')}: {category.icon}
                        </p>
                    )}
                    {category.parent_id && (
                        <p>
                            {t('categories.parent')}: {category.parent_id}
                        </p>
                    )}
                </div>
            ))}

            <Dialog
                open={openDialog}
                onCloseDialog={() => {
                    setOpenDialog(false)
                    reset()
                }}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                    flexDirection: 'column',
                    padding: '1.5rem',
                    backgroundColor: 'var(--surface)'
                }}
            >
                <h3>{t('categories.add')}</h3>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className='form-wrapper'
                >
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

                    <div>
                        <label htmlFor='name'>{t('categories.name')}</label>
                        <Input
                            id='name'
                            type='text'
                            size='medium'
                            placeholder={t('categories.name')}
                            {...register('name', {
                                required: t('categories.name') + ' ' + t('common.required'),
                                maxLength: {
                                    value: 100,
                                    message: t('categories.name.maxLength')
                                }
                            })}
                        />
                        {errors.name && <p className='error'>{errors.name.message}</p>}
                    </div>
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
                    <div>
                        <label htmlFor='icon'>{t('categories.icon')}</label>
                        <Input
                            id='icon'
                            type='text'
                            size='medium'
                            placeholder={t('categories.icon')}
                            {...register('icon', {
                                maxLength: {
                                    value: 50,
                                    message: t('categories.icon.maxLength')
                                }
                            })}
                        />
                        {errors.icon && <p className='error'>{errors.icon.message}</p>}
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
        </AppLayout>
    )
}

export default Categories
