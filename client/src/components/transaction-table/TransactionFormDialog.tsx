import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, DatePicker, Dialog, DialogProps, Message, Select } from 'simple-react-ui-kit'

import { ApiModel, useAddTransactionMutation, useListPayeesQuery, useUpdateTransactionMutation } from '@/api'
import { AccountSelectField, CategorySelectField, Currency, CurrencyInput } from '@/components'
import { useAppSelector } from '@/store/hooks'

import { DEFAULT_VALUES, TransactionFormData } from './constants'

import styles from './styles.module.sass'

interface TransactionFormDialogProps extends Partial<DialogProps> {
    transactionData?: ApiModel.Transaction
    onDelete?: (transaction: ApiModel.Transaction) => void
}

export const TransactionFormDialog: React.FC<TransactionFormDialogProps> = (props) => {
    const { t, i18n } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const [payeeSearch, setPayeeSearch] = useState('')
    const [debouncedPayeeSearch, setDebouncedPayeeSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedPayeeSearch(payeeSearch), 300)
        return () => clearTimeout(timer)
    }, [payeeSearch])

    const { data: payeeOptions } = useListPayeesQuery(
        debouncedPayeeSearch ? { search: debouncedPayeeSearch } : undefined,
        { skip: !isAuth }
    )

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        getValues,
        setValue,
        watch
    } = useForm<TransactionFormData>({
        defaultValues: DEFAULT_VALUES
    })

    const formValues = watch()

    const [createTransaction, { isLoading: isCreateLoading, error: createApiError, reset: createReset }] =
        useAddTransactionMutation()
    const [updateCategory, { isLoading: isUpdateLoading, error: updateApiError, reset: updateReset }] =
        useUpdateTransactionMutation()

    const onSubmit = async (data: TransactionFormData) => {
        try {
            if (props?.transactionData?.id) {
                await updateCategory({ id: props.transactionData.id, ...data }).unwrap()
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
                        {t('common.errors.unknown', 'An unknown error occurred')}
                    </Message>
                )}

                <DatePicker
                    datePeriod={[getValues('date'), getValues('date')]}
                    locale={i18n.language === 'en' ? 'en' : 'ru'}
                    buttonMode={'secondary'}
                    placeholder={t('select-date', 'Select date')}
                    onDateSelect={(date) => setValue('date', date)}
                />

                <Select<string>
                    searchable
                    clearable
                    value={getValues('payee') ?? undefined}
                    placeholder={t('screens.transactions.payee', 'Payee')}
                    options={(payeeOptions ?? []).map((p) => ({ key: p.name, value: p.name }))}
                    onSearch={(q) => setPayeeSearch(q ?? '')}
                    onSelect={(items) => setValue('payee', items?.[0]?.value ?? '')}
                />

                <div className={styles.transactionFormRow}>
                    <CurrencyInput
                        value={getValues('amount')}
                        currency={Currency.USD}
                        locale={i18n.language}
                        error={errors?.amount?.message}
                        onValueChange={(amount) => setValue('amount', amount || 0)}
                        {...register('amount', {
                            required: t('screens.transactions.form.amount_required', 'Amount is required'),
                            min: {
                                value: 0.01,
                                message: t('screens.transactions.form.amount_min', 'Amount must be at least 0.01')
                            }
                        })}
                    />

                    <Select<string>
                        value={formValues.type}
                        placeholder={t('screens.transactions.form.type', 'Select type')}
                        options={[
                            { key: 'expense', value: t('transactions.types.expense', 'Expense') },
                            { key: 'income', value: t('transactions.types.income', 'Income') }
                        ]}
                        onSelect={(value) => setValue('type', value?.[0]?.key as 'income' | 'expense')}
                    />
                </div>

                <div className={styles.transactionFormRow}>
                    <CategorySelectField
                        enableAutoSelect={true}
                        value={formValues.category_id}
                        error={errors?.category_id?.message}
                        onSelect={(option) => setValue('category_id', option?.[0]?.key ?? '')}
                    />

                    <AccountSelectField
                        enableAutoSelect={true}
                        value={formValues.account_id}
                        error={errors?.account_id?.message}
                        onSelect={(option) => setValue('account_id', option?.[0]?.key ?? '')}
                    />
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

                {props.onDelete && props.transactionData && (
                    <Button
                        style={{ width: '100%' }}
                        mode='outline'
                        variant='negative'
                        label={t('transactions.deleteTransaction', 'Delete Transaction')}
                        onClick={() => props.onDelete?.(props.transactionData!)}
                    />
                )}
            </form>
        </Dialog>
    )
}
