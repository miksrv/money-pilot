import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, DialogProps, Dropdown, Input, Message } from 'simple-react-ui-kit'

import { ApiModel, useAddTransactionMutation, useUpdateTransactionMutation } from '@/api'
import { AccountSelectField, CategorySelectField, Currency, CurrencyInput } from '@/components'

import styles from './styles.module.sass'

interface TransactionFormProps extends Partial<DialogProps> {
    transactionData?: ApiModel.Category
}

type TransactionFormData = Pick<
    ApiModel.Transaction,
    'account_id' | 'amount' | 'type' | 'date' | 'description' | 'category_id' | 'payee_id'
>

const DEFAULT_VALUES: TransactionFormData = {
    account_id: '',
    amount: 0,
    type: 'expense',
    date: new Date().toISOString().split('T')[0], // Default to today
    description: '',
    category_id: '',
    payee_id: ''
}

export const TransactionForm: React.FC<TransactionFormProps> = (props) => {
    const { t, i18n } = useTranslation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues
    } = useForm<TransactionFormData>({
        defaultValues: DEFAULT_VALUES
    })

    const [createTransaction, { isLoading: isCreateLoading, error: createApiError, reset: createReset }] =
        useAddTransactionMutation()
    const [updateCategory, { isLoading: isUpdateLoading, error: updateApiError, reset: updateReset }] =
        useUpdateTransactionMutation()

    const onSubmit = async (data: TransactionFormData) => {
        try {
            if (props?.transactionData?.id) {
                await updateCategory(data).unwrap()
            } else {
                await createTransaction(data).unwrap()
            }

            props?.onCloseDialog?.()
            reset(DEFAULT_VALUES)
        } catch (err) {
            console.error('Failed to add transaction:', err)
        }
    }

    useEffect(() => {
        if (props?.transactionData) {
            reset(props.transactionData)
        }
    }, [props?.transactionData])

    useEffect(() => {
        updateReset()
        createReset()
    }, [props.open])

    return (
        <Dialog
            title={
                props?.transactionData?.id
                    ? t('screens.transactions.form.edit_title', 'Edit Transaction')
                    : t('screens.transactions.form.create_title', 'Add Transaction')
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
                        {createApiError || updateApiError || t('common.errors.unknown', 'An unknown error occurred')}
                    </Message>
                )}

                <Input
                    id='payee_id'
                    type='text'
                    size='medium'
                    error={errors?.payee_id?.message}
                    placeholder={t('screens.transactions.payee', 'Получатель')}
                    {...register('payee_id')}
                />

                <div className={styles.transactionFormRow}>
                    <CategorySelectField
                        enableAutoSelect={true}
                        value={getValues('category_id')}
                        error={errors?.category_id?.message}
                        onSelect={(option) => reset({ ...getValues(), category_id: option?.key })}
                    />

                    <AccountSelectField
                        enableAutoSelect={true}
                        value={getValues('account_id')}
                        error={errors?.account_id?.message}
                        onSelect={(option) => reset({ ...getValues(), account_id: option?.key })}
                    />
                </div>

                <div className={styles.transactionFormRow}>
                    <CurrencyInput
                        value={getValues('amount')}
                        currency={Currency.USD}
                        locale={i18n.language}
                        onValueChange={(amount) => reset({ ...getValues(), amount: amount || 0 })}
                    />

                    <Dropdown<string>
                        mode={'outline'}
                        value={getValues('type')}
                        placeholder={t('screens.transactions.form.type', 'Select type')}
                        options={[
                            { key: 'expense', value: t('transactions.types.expense', 'Expense') },
                            { key: 'income', value: t('transactions.types.income', 'Income') }
                        ]}
                        onSelect={(value) => {
                            reset({ ...getValues(), type: value?.value as 'income' | 'expense' })
                        }}
                    />
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

                <Button
                    style={{ width: '100%' }}
                    type='submit'
                    mode='primary'
                    label={
                        isCreateLoading || isUpdateLoading
                            ? t('transactions.save_button_loading', 'Loading...')
                            : t('transactions.save_button', 'Save Transaction')
                    }
                    disabled={isCreateLoading || isUpdateLoading}
                />
            </form>
        </Dialog>
    )
}
