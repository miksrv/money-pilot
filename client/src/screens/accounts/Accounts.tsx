// src/pages/Accounts.tsx
import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Input } from 'simple-react-ui-kit'

import { ApiModel, useAddAccountMutation, useListAccountQuery } from '@/api'
import { AppLayout } from '@/components'

type AccountFormData = Pick<ApiModel.Account, 'name' | 'type' | 'balance' | 'institution'>

export const Accounts: React.FC = () => {
    const { t } = useTranslation()
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<AccountFormData>({
        defaultValues: {
            name: '',
            type: 'checking',
            balance: 0,
            institution: ''
        }
    })
    const [addAccount, { isLoading, error: apiError }] = useAddAccountMutation()

    const { data } = useListAccountQuery()

    const onSubmit = async (data: AccountFormData) => {
        try {
            await addAccount(data).unwrap()
            setOpenTransactionDialog(false)
            reset()
        } catch (err) {
            console.error('Failed to add account:', err)
        }
    }

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => setOpenTransactionDialog(true)}
                    label={t('accounts.add', 'Добавить аккаунт')}
                />
            }
        >
            <h2>{t('accounts.title', 'Аккаунты')}</h2>

            {data?.map((account) => (
                <div
                    key={account.id}
                    style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: 'var(--surface)'
                    }}
                >
                    <h3>{account.name}</h3>
                    <p>
                        {t('accounts.type', 'Тип')}: {t(`accounts.types.${account.type}`, account.type)}
                    </p>
                    <p>
                        {t('accounts.balance', 'Баланс')}: {account.balance.toFixed(2)}
                    </p>
                    {account.institution && (
                        <p>
                            {t('accounts.institution', 'Банк/Организация')}: {account.institution}
                        </p>
                    )}
                </div>
            ))}

            <Dialog
                open={openTransactionDialog}
                onCloseDialog={() => {
                    setOpenTransactionDialog(false)
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
                <h3>{t('accounts.add', 'Добавить аккаунт')}</h3>
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className='form-wrapper'
                >
                    <div>
                        <label htmlFor='name'>{t('accounts.name', 'Название')}</label>
                        <Input
                            id='name'
                            type='text'
                            size='medium'
                            placeholder={t('accounts.name', 'Название')}
                            {...register('name', {
                                required: t('accounts.name', 'Название') + ' ' + t('common.required', 'обязательно'),
                                maxLength: {
                                    value: 100,
                                    message: t('accounts.name.maxLength', 'Название не может превышать 100 символов')
                                }
                            })}
                        />
                        {errors.name && <p className='error'>{errors.name.message}</p>}
                    </div>
                    <div>
                        <label htmlFor='type'>{t('accounts.type', 'Тип')}</label>
                        <select
                            id='type'
                            {...register('type', {
                                required: t('accounts.type', 'Тип') + ' ' + t('common.required', 'обязательно')
                            })}
                            className='w-full rounded-md border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:outline-none'
                        >
                            <option value='checking'>{t('accounts.types.checking', 'Текущий')}</option>
                            <option value='savings'>{t('accounts.types.savings', 'Сберегательный')}</option>
                            <option value='credit'>{t('accounts.types.credit', 'Кредитный')}</option>
                            <option value='investment'>{t('accounts.types.investment', 'Инвестиционный')}</option>
                        </select>
                        {errors.type && <p className='error'>{errors.type.message}</p>}
                    </div>
                    <div>
                        <label htmlFor='balance'>{t('accounts.balance', 'Баланс')}</label>
                        <Input
                            id='balance'
                            type='number'
                            size='medium'
                            step='0.01'
                            placeholder={t('accounts.balance', 'Баланс')}
                            {...register('balance', {
                                required: t('accounts.balance', 'Баланс') + ' ' + t('common.required', 'обязательно'),
                                min: {
                                    value: 0,
                                    message: t('accounts.balance.min', 'Баланс не может быть отрицательным')
                                }
                            })}
                        />
                        {errors.balance && <p className='error'>{errors.balance.message}</p>}
                    </div>
                    <div>
                        <label htmlFor='institution'>{t('accounts.institution', 'Банк/Организация')}</label>
                        <Input
                            id='institution'
                            type='text'
                            size='medium'
                            placeholder={t('accounts.institution', 'Банк/Организация')}
                            {...register('institution', {
                                maxLength: {
                                    value: 100,
                                    message: t(
                                        'accounts.institution.maxLength',
                                        'Название организации не может превышать 100 символов'
                                    )
                                }
                            })}
                        />
                        {errors.institution && <p className='error'>{errors.institution.message}</p>}
                    </div>
                    {apiError && (
                        <p className='error'>{apiError?.data?.messages?.error || t('accounts.error', 'Ошибка')}</p>
                    )}
                    <Button
                        style={{ width: '100%' }}
                        type='submit'
                        mode='primary'
                        label={isLoading ? '...' : t('accounts.create', 'Создать')}
                        disabled={isLoading}
                    />
                </form>
            </Dialog>
        </AppLayout>
    )
}
