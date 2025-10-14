import React from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogProps, Input } from 'simple-react-ui-kit'

import { ApiModel, useAddTransactionMutation, useListCategoriesQuery, useListTransactionsQuery } from '@/api'
import { AccountSelectField, CategorySelectField } from '@/components'

import { MoneyInput } from '../../components'

type TransactionFormData = Pick<
    ApiModel.Transaction,
    'account_id' | 'amount' | 'type' | 'date' | 'description' | 'category_id' | 'payee_id'
>

export interface TransactionFormProps extends Partial<DialogProps> {}

export const TransactionForm: React.FC<TransactionFormProps> = (props) => {
    const { t } = useTranslation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues
    } = useForm<TransactionFormData>({
        defaultValues: {
            account_id: '',
            amount: 0,
            type: 'expense',
            date: new Date().toISOString().split('T')[0], // Default to today
            description: '',
            category_id: '',
            payee_id: ''
        }
    })

    const [addTransaction, { isLoading, error: apiError }] = useAddTransactionMutation()

    const { data: transactions } = useListTransactionsQuery()
    const { data: categories } = useListCategoriesQuery()

    const onSubmit = async (data: TransactionFormData) => {
        try {
            await addTransaction(data).unwrap()
            props?.onCloseDialog?.()
            reset()
        } catch (err) {
            console.error('Failed to add transaction:', err)
        }
    }

    return (
        <Dialog
            open={props?.open}
            onCloseDialog={() => {
                props?.onCloseDialog?.()
                reset()
            }}
        >
            <form onSubmit={handleSubmit(onSubmit)}>
                <CategorySelectField
                    value={getValues('category_id')}
                    error={errors?.category_id?.message}
                    onSelect={(option) => reset({ ...getValues(), category_id: option?.key })}
                />

                <br />

                <AccountSelectField
                    value={getValues('account_id')}
                    error={errors?.account_id?.message}
                    onSelect={(option) => reset({ ...getValues(), account_id: option?.key })}
                />

                <br />

                <MoneyInput
                    value={getValues('amount')}
                    onChange={(amount) => reset({ ...getValues(), amount: amount })}
                />

                <div>
                    <label htmlFor='type'>{t('transactions.type', 'Тип')}</label>
                    <select
                        id='type'
                        {...register('type', {
                            required: t('transactions.type', 'Тип') + ' ' + t('common.required', 'обязательно')
                        })}
                        className='w-full rounded-md border border-[var(--border)] px-3 py-2 focus:border-[var(--primary)] focus:outline-none'
                    >
                        <option value='income'>{t('transactions.types.income', 'Доход')}</option>
                        <option value='expense'>{t('transactions.types.expense', 'Расход')}</option>
                    </select>
                    {errors.type && <p className='error'>{errors.type.message}</p>}
                </div>
                <div>
                    <label htmlFor='date'>{t('transactions.date', 'Дата')}</label>
                    <Input
                        id='date'
                        type='date'
                        size='medium'
                        placeholder={t('transactions.date', 'Дата')}
                        {...register('date', {
                            required: t('transactions.date', 'Дата') + ' ' + t('common.required', 'обязательно')
                        })}
                    />
                    {errors.date && <p className='error'>{errors.date.message}</p>}
                </div>
                <div>
                    <label htmlFor='description'>{t('transactions.description', 'Описание')}</label>
                    <Input
                        id='description'
                        type='text'
                        size='medium'
                        placeholder={t('transactions.description', 'Описание')}
                        {...register('description', {
                            maxLength: {
                                value: 255,
                                message: t(
                                    'transactions.description.maxLength',
                                    'Описание не может превышать 255 символов'
                                )
                            }
                        })}
                    />
                    {errors.description && <p className='error'>{errors.description.message}</p>}
                </div>
                <div>
                    <label htmlFor='payee_id'>{t('transactions.payee', 'Получатель')}</label>
                    <Input
                        id='payee_id'
                        type='text'
                        size='medium'
                        placeholder={t('transactions.payee', 'Получатель')}
                        {...register('payee_id')}
                    />
                    {errors.payee_id && <p className='error'>{errors.payee_id.message}</p>}
                </div>
                {apiError && (
                    <p className='error'>{apiError?.data?.messages?.error || t('transactions.error', 'Ошибка')}</p>
                )}
                <Button
                    style={{ width: '100%' }}
                    type='submit'
                    mode='primary'
                    label={isLoading ? '...' : t('transactions.create', 'Создать')}
                    disabled={isLoading}
                />
            </form>
        </Dialog>
    )
}
