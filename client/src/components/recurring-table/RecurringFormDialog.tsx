import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, DatePicker, Dialog, DialogProps, Input, Message, Select } from 'simple-react-ui-kit'

import { ApiModel, useAddRecurringMutation, useUpdateRecurringMutation } from '@/api'
import { AccountSelectField, CategorySelectField, Currency, CurrencyInput } from '@/components'

import styles from './styles.module.sass'

interface RecurringFormDialogProps extends Partial<DialogProps> {
    recurringData?: ApiModel.RecurringTransaction
    onDelete?: (item: ApiModel.RecurringTransaction) => void
}

type RecurringFormData = {
    name: string
    type: 'income' | 'expense'
    amount: number
    account_id: string
    category_id: string
    payee_name: string
    frequency: ApiModel.RecurringTransaction['frequency']
    start_date: string
    end_date: string
    auto_create: boolean
    notes: string
}

const FREQUENCY_KEYS: Array<ApiModel.RecurringTransaction['frequency']> = [
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly'
]

const DEFAULT_FORM: RecurringFormData = {
    name: '',
    type: 'expense',
    amount: 0,
    account_id: '',
    category_id: '',
    payee_name: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_create: false,
    notes: ''
}

export const RecurringFormDialog: React.FC<RecurringFormDialogProps> = (props) => {
    const { t, i18n } = useTranslation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        watch,
        setValue
    } = useForm<RecurringFormData>({ defaultValues: DEFAULT_FORM })

    const formType = watch('type')
    const formAmount = watch('amount')
    const formAccountId = watch('account_id')
    const formCategoryId = watch('category_id')
    const formFrequency = watch('frequency')
    const formStartDate = watch('start_date')
    const formEndDate = watch('end_date')
    const formAutoCreate = watch('auto_create')

    const [addRecurring, { isLoading: isAdding, error: addError, reset: addReset }] = useAddRecurringMutation()
    const [updateRecurring, { isLoading: isUpdating, error: updateError, reset: updateReset }] =
        useUpdateRecurringMutation()

    useEffect(() => {
        if (props?.recurringData) {
            reset({
                name: props.recurringData.name,
                type: props.recurringData.type,
                amount: props.recurringData.amount,
                account_id: props.recurringData.account_id,
                category_id: props.recurringData.category_id ?? '',
                payee_name: props.recurringData.payee_name ?? '',
                frequency: props.recurringData.frequency,
                start_date: props.recurringData.start_date,
                end_date: props.recurringData.end_date ?? '',
                auto_create: props.recurringData.auto_create === 1,
                notes: props.recurringData.notes ?? ''
            })
        } else {
            reset(DEFAULT_FORM)
        }
    }, [props?.recurringData, props.open])

    useEffect(() => {
        addReset()
        updateReset()
    }, [props.open])

    const onSubmit = async (data: RecurringFormData) => {
        const body: ApiModel.CreateRecurringBody = {
            name: data.name,
            type: data.type,
            amount: data.amount,
            account_id: data.account_id,
            category_id: data.category_id || null,
            payee_name: data.payee_name || null,
            notes: data.notes || null,
            frequency: data.frequency,
            start_date: data.start_date,
            end_date: data.end_date || null,
            is_active: 1,
            auto_create: data.auto_create ? 1 : 0
        }
        try {
            if (props.recurringData?.id) {
                await updateRecurring({ id: props.recurringData.id, ...body }).unwrap()
            } else {
                await addRecurring(body).unwrap()
            }
            props?.onCloseDialog?.()
            reset(DEFAULT_FORM)
        } catch {
            // error visible via RTK state
        }
    }

    const frequencyOptions = FREQUENCY_KEYS.map((k) => ({
        key: k,
        value: t('recurring.frequency.' + k, k)
    }))

    const typeOptions = [
        { key: 'expense', value: t('transactions.types.expense', 'Expense') },
        { key: 'income', value: t('transactions.types.income', 'Income') }
    ]

    const isSaving = isAdding || isUpdating
    const isEditing = !!props.recurringData?.id

    return (
        <Dialog
            title={
                isEditing
                    ? t('recurring.editRecurring', 'Edit Recurring')
                    : t('recurring.addRecurring', 'Add Recurring')
            }
            open={props?.open}
            onCloseDialog={() => {
                props?.onCloseDialog?.()
                reset(DEFAULT_FORM)
            }}
        >
            <form
                className={styles.form}
                onSubmit={handleSubmit(onSubmit)}
            >
                {(addError || updateError) && (
                    <Message type='error'>{t('common.errors.unknown', 'An unknown error occurred')}</Message>
                )}

                <Input
                    id='rec-name'
                    type='text'
                    size='medium'
                    label={t('accounts.name', 'Name')}
                    placeholder={t('accounts.name', 'Name')}
                    error={errors.name?.message}
                    {...register('name', { required: t('common.required', 'Required') })}
                />

                <div className={styles.formRow}>
                    <Select<string>
                        label={t('screens.transactions.form.type', 'Type')}
                        value={formType}
                        options={typeOptions}
                        onSelect={(sel) => setValue('type', (sel?.[0]?.key ?? 'expense') as 'income' | 'expense')}
                    />

                    <Select<string>
                        label={t('recurring.frequency.label', 'Frequency')}
                        value={formFrequency}
                        options={frequencyOptions}
                        onSelect={(sel) =>
                            setValue(
                                'frequency',
                                (sel?.[0]?.key ?? 'monthly') as ApiModel.RecurringTransaction['frequency']
                            )
                        }
                    />
                </div>

                <CurrencyInput
                    label={t('transactions.amount', 'Amount')}
                    value={formAmount}
                    currency={Currency.USD}
                    locale={i18n.language}
                    error={errors?.amount?.message}
                    onValueChange={(val) => setValue('amount', val ?? 0)}
                    {...register('amount', {
                        required: t('screens.transactions.form.amount_required', 'Amount is required'),
                        min: {
                            value: 0.01,
                            message: t('screens.transactions.form.amount_min', 'Amount must be at least 0.01')
                        }
                    })}
                />

                <AccountSelectField
                    label={t('transactions.account', 'Account')}
                    value={formAccountId}
                    error={errors?.account_id?.message}
                    onSelect={(opt) => setValue('account_id', opt?.[0]?.key ?? '')}
                />

                <CategorySelectField
                    label={t('transactions.category', 'Category')}
                    value={formCategoryId}
                    onSelect={(opt) => setValue('category_id', opt?.[0]?.key ?? '')}
                />

                <Input
                    id='rec-payee'
                    type='text'
                    size='medium'
                    placeholder={t('transactions.payee', 'Payee')}
                    {...register('payee_name')}
                />

                <div className={styles.formRow}>
                    <DatePicker
                        datePeriod={[formStartDate, formStartDate]}
                        locale={i18n.language === 'en' ? 'en' : 'ru'}
                        buttonMode='secondary'
                        placeholder={t('recurring.startDate', 'Start Date')}
                        onDateSelect={(date) => setValue('start_date', date)}
                    />

                    <DatePicker
                        datePeriod={formEndDate ? [formEndDate, formEndDate] : undefined}
                        locale={i18n.language === 'en' ? 'en' : 'ru'}
                        buttonMode='secondary'
                        placeholder={t('recurring.endDate', 'End Date (optional)')}
                        onDateSelect={(date) => setValue('end_date', date)}
                    />
                </div>

                <Checkbox
                    label={t('recurring.autoCreate', 'Automatically create transactions on due date')}
                    checked={formAutoCreate}
                    onChange={(e) => setValue('auto_create', e.target.checked)}
                />

                <Input
                    id='rec-notes'
                    type='text'
                    size='medium'
                    placeholder={t('transactions.notes', 'Notes')}
                    {...register('notes')}
                />

                <Button
                    stretched
                    type='submit'
                    mode='primary'
                    label={isSaving ? t('common.loading', 'Loading...') : t('common.save', 'Save')}
                    disabled={isSaving}
                />

                {props.onDelete && props.recurringData && (
                    <Button
                        stretched
                        mode='outline'
                        variant='negative'
                        label={t('recurring.deleteRecurring', 'Delete Recurring')}
                        onClick={() => props.onDelete?.(props.recurringData!)}
                    />
                )}
            </form>
        </Dialog>
    )
}
