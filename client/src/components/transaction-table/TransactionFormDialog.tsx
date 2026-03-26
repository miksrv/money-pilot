import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, DatePicker, Dialog, DialogProps, Input, Message, Select } from 'simple-react-ui-kit'

import { ApiModel, useAddTransactionMutation, useListPayeesQuery, useUpdateTransactionMutation } from '@/api'
import { AccountSelectField, CategorySelectField, Currency, CurrencyInput } from '@/components'
import { useAppSelector } from '@/store/hooks'

import { DEFAULT_VALUES, TransactionFormData } from './constants'

import styles from './styles.module.sass'

interface TransactionFormDialogProps extends Partial<DialogProps> {
    transactionData?: ApiModel.Transaction
    onDelete?: (transaction: ApiModel.Transaction) => void
    onTransactionSaved?: () => void
}

export const TransactionFormDialog: React.FC<TransactionFormDialogProps> = (props) => {
    const { t, i18n } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

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
        watch,
        setError
    } = useForm<TransactionFormData>({
        defaultValues: DEFAULT_VALUES
    })

    const currentType = watch('type')

    const [createTransaction, { isLoading: isCreateLoading, reset: createReset }] = useAddTransactionMutation()
    const [updateTransaction, { isLoading: isUpdateLoading, reset: updateReset }] = useUpdateTransactionMutation()

    const onSubmit = async (data: TransactionFormData) => {
        // Manual validation for select fields
        if (!data.category_id) {
            setError('category_id', { message: t('common.required', 'Required') })
            return
        }
        if (!data.account_id) {
            setError('account_id', { message: t('common.required', 'Required') })
            return
        }

        try {
            if (props?.transactionData?.id) {
                await updateTransaction({ id: props.transactionData.id, ...data }).unwrap()
            } else {
                await createTransaction({
                    ...data,
                    ...(activeGroupId && { group_id: activeGroupId })
                }).unwrap()
            }

            props?.onCloseDialog?.()
            props?.onTransactionSaved?.()
            reset(DEFAULT_VALUES)
        } catch {
            setError('root', { message: t('common.errors.unknown') })
        }
    }

    useEffect(() => {
        if (props?.transactionData) {
            reset({
                ...props.transactionData,
                notes: ''
            })
        }
    }, [props?.transactionData])

    useEffect(() => {
        updateReset()
        createReset()
    }, [props.open])

    const isExpense = currentType === 'expense'

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
                onSubmit={(e) => {
                    e.preventDefault()
                    void handleSubmit(onSubmit)(e)
                }}
            >
                <div className={styles.typeToggle}>
                    <button
                        type='button'
                        className={[styles.typeBtn, isExpense ? styles.typeBtnExpenseActive : ''].join(' ')}
                        onClick={() => setValue('type', 'expense')}
                    >
                        {t('transactions.types.expense', 'Expense')}
                    </button>
                    <button
                        type='button'
                        className={[styles.typeBtn, !isExpense ? styles.typeBtnIncomeActive : ''].join(' ')}
                        onClick={() => setValue('type', 'income')}
                    >
                        {t('transactions.types.income', 'Income')}
                    </button>
                </div>

                <div
                    className={[styles.amountWrapper, isExpense ? styles.amountExpense : styles.amountIncome].join(' ')}
                >
                    <CurrencyInput
                        value={getValues('amount')}
                        currency={Currency.USD}
                        locale={i18n.language}
                        error={errors?.amount?.message}
                        placeholder={t('transactions.amount', 'Amount')}
                        onValueChange={(amount) => setValue('amount', amount || ('' as unknown as number))}
                        {...register('amount', {
                            required: t('screens.transactions.form.amount_required', 'Amount is required'),
                            min: {
                                value: 0.01,
                                message: t('screens.transactions.form.amount_min', 'Amount must be at least 0.01')
                            }
                        })}
                    />
                </div>

                <DatePicker
                    datePeriod={[getValues('date'), getValues('date')]}
                    locale={i18n.language === 'en' ? 'en' : 'ru'}
                    buttonMode={'secondary'}
                    placeholder={t('select-date', 'Select date')}
                    onDateSelect={(date) => setValue('date', date)}
                />

                <div onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
                    <Select<string>
                        searchable
                        clearable
                        value={watch('payee') || undefined}
                        placeholder={t('screens.transactions.payee', 'Payee')}
                        options={(payeeOptions ?? []).map((p) => ({ key: p.name, value: p.name }))}
                        onSearch={(q) => setPayeeSearch(q ?? '')}
                        onSelect={(items) => {
                            setValue('payee', items?.[0]?.value ?? '')
                        }}
                    />
                </div>

                <CategorySelectField
                    enableAutoSelect={!props?.transactionData?.id}
                    groupId={activeGroupId ?? undefined}
                    value={watch('category_id')}
                    error={errors?.category_id?.message}
                    onSelect={(option) => {
                        setValue('category_id', option?.[0]?.key ?? '', { shouldValidate: true })
                    }}
                />

                <AccountSelectField
                    enableAutoSelect={!props?.transactionData?.id}
                    groupId={activeGroupId ?? undefined}
                    value={watch('account_id')}
                    error={errors?.account_id?.message}
                    onSelect={(option) => {
                        setValue('account_id', option?.[0]?.key ?? '', { shouldValidate: true })
                    }}
                />

                <Input
                    type='text'
                    placeholder={t('transactions.notesPlaceholder', 'Optional note\u2026')}
                    label={t('transactions.notes', 'Notes')}
                    {...register('notes')}
                />

                {errors.root && <Message type='error'>{errors.root.message}</Message>}

                <Button
                    type='submit'
                    mode='primary'
                    stretched={true}
                    label={
                        isCreateLoading || isUpdateLoading
                            ? t('common.loading', 'Loading...')
                            : t('transactions.save_button', 'Save Transaction')
                    }
                    disabled={isCreateLoading || isUpdateLoading}
                />

                {props.onDelete && props.transactionData && (
                    <Button
                        type='button'
                        mode='outline'
                        variant='negative'
                        stretched={true}
                        label={t('transactions.deleteTransaction', 'Delete Transaction')}
                        onClick={() => props.onDelete?.(props.transactionData!)}
                    />
                )}
            </form>
        </Dialog>
    )
}
