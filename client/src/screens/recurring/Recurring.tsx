import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
    Badge,
    Button,
    Checkbox,
    DatePicker,
    Dialog,
    Input,
    Message,
    Popout,
    Select,
    Skeleton,
    Table
} from 'simple-react-ui-kit'

import {
    ApiModel,
    useAddRecurringMutation,
    useDeleteRecurringMutation,
    useGenerateRecurringMutation,
    useListRecurringQuery,
    useToggleRecurringMutation,
    useUpdateRecurringMutation
} from '@/api'
import { AccountSelectField, AppLayout, CategorySelectField, Currency, CurrencyInput } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatDate } from '@/utils/dates'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

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

const FREQUENCY_KEYS: ApiModel.RecurringTransaction['frequency'][] = [
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly'
]

export const Recurring: React.FC = () => {
    const { t, i18n } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth)

    const [openForm, setOpenForm] = useState(false)
    const [editTarget, setEditTarget] = useState<ApiModel.RecurringTransaction | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.RecurringTransaction | undefined>()
    const [isDeleting, setIsDeleting] = useState(false)

    const { data: items, isLoading } = useListRecurringQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

    const [addRecurring, { isLoading: isAdding }] = useAddRecurringMutation()
    const [updateRecurring, { isLoading: isUpdating }] = useUpdateRecurringMutation()
    const [deleteRecurring] = useDeleteRecurringMutation()
    const [generateRecurring] = useGenerateRecurringMutation()
    const [toggleRecurring] = useToggleRecurringMutation()

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

    useEffect(() => {
        if (editTarget) {
            reset({
                name: editTarget.name,
                type: editTarget.type,
                amount: editTarget.amount,
                account_id: editTarget.account_id,
                category_id: editTarget.category_id ?? '',
                payee_name: editTarget.payee_name ?? '',
                frequency: editTarget.frequency,
                start_date: editTarget.start_date,
                end_date: editTarget.end_date ?? '',
                auto_create: editTarget.auto_create === 1,
                notes: editTarget.notes ?? ''
            })
        } else {
            reset(DEFAULT_FORM)
        }
    }, [editTarget, openForm])

    const today = new Date().toISOString().split('T')[0]
    const isOverdue = (nextDue: string) => nextDue < today

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
            if (editTarget?.id) {
                await updateRecurring({ id: editTarget.id, ...body }).unwrap()
            } else {
                await addRecurring(body).unwrap()
            }
            setOpenForm(false)
            setEditTarget(undefined)
        } catch {
            // error visible via RTK state
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget?.id) {
            return
        }
        setIsDeleting(true)
        try {
            await deleteRecurring(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
        } catch {
            // silent
        } finally {
            setIsDeleting(false)
        }
    }

    const handleGenerate = async (id: string) => {
        try {
            await generateRecurring(id).unwrap()
        } catch {
            // silent
        }
    }

    const handleToggle = async (id: string) => {
        try {
            await toggleRecurring(id).unwrap()
        } catch {
            // silent
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

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    label={t('recurring.addRecurring', 'Add Recurring')}
                    onClick={() => {
                        setEditTarget(undefined)
                        setOpenForm(true)
                    }}
                />
            }
        >
            {isLoading && <Skeleton style={{ height: '200px', width: '100%' }} />}

            {!isLoading && (!items || items.length === 0) && (
                <div className={styles.emptyState}>
                    <Message type='info'>{t('recurring.noRecurring', 'No recurring transactions yet')}</Message>
                    <Button
                        mode='secondary'
                        icon='PlusCircle'
                        label={t('recurring.addFirst', 'Add your first recurring transaction')}
                        onClick={() => {
                            setEditTarget(undefined)
                            setOpenForm(true)
                        }}
                    />
                </div>
            )}

            {!isLoading && items && items.length > 0 && (
                <Table<ApiModel.RecurringTransaction>
                    data={items}
                    columns={[
                        {
                            header: t('accounts.name', 'Name'),
                            accessor: 'name',
                            formatter: (_value, rows, index) => {
                                const item = rows[index]
                                return (
                                    <div className={styles.nameCell}>
                                        <span>{item.name}</span>
                                        {item.payee_name && (
                                            <span className={styles.nameSubtitle}>{item.payee_name}</span>
                                        )}
                                    </div>
                                )
                            }
                        },
                        {
                            header: t('transactions.amount', 'Amount'),
                            accessor: 'amount',
                            formatter: (_value, rows, index) => {
                                const item = rows[index]
                                return (
                                    <span
                                        className={
                                            item.type === 'income' ? styles.amountIncome : styles.amountExpense
                                        }
                                    >
                                        {item.type === 'income' ? '+' : '-'}
                                        {formatMoney(item.amount, Currency.USD)}
                                    </span>
                                )
                            }
                        },
                        {
                            header: t('recurring.frequency.monthly', 'Frequency'),
                            accessor: 'frequency',
                            formatter: (value) => (
                                <Badge
                                    label={t('recurring.frequency.' + (value as string), value as string)}
                                    size='small'
                                />
                            )
                        },
                        {
                            header: t('recurring.nextDue', 'Next Due'),
                            accessor: 'next_due_date',
                            formatter: (value) => {
                                const dateStr = value as string
                                return (
                                    <span className={isOverdue(dateStr) ? styles.overdue : undefined}>
                                        {formatDate(dateStr, 'DD.MM.YYYY')}
                                    </span>
                                )
                            }
                        },
                        {
                            header: t('transactions.filterByType', 'Status'),
                            accessor: 'is_active',
                            formatter: (value) => (
                                <Badge
                                    label={
                                        value === 1
                                            ? t('recurring.active', 'Active')
                                            : t('recurring.paused', 'Paused')
                                    }
                                    size='small'
                                />
                            )
                        },
                        {
                            header: '',
                            accessor: 'id',
                            formatter: (_value, rows, index) => {
                                const item = rows[index]
                                return (
                                    <Popout
                                        trigger={<Button mode='link' icon='VerticalDots' />}
                                        closeOnChildrenClick
                                    >
                                        <Button
                                            mode='link'
                                            icon='Pencil'
                                            label={t('common.edit', 'Edit')}
                                            onClick={() => {
                                                setEditTarget(item)
                                                setOpenForm(true)
                                            }}
                                        />
                                        <Button
                                            mode='link'
                                            label={t('recurring.generateNow', 'Generate Now')}
                                            onClick={() => handleGenerate(item.id)}
                                        />
                                        <Button
                                            mode='link'
                                            label={
                                                item.is_active === 1
                                                    ? t('recurring.paused', 'Pause')
                                                    : t('recurring.active', 'Activate')
                                            }
                                            onClick={() => handleToggle(item.id)}
                                        />
                                        <Button
                                            mode='link'
                                            icon='Close'
                                            variant='negative'
                                            label={t('common.delete', 'Delete')}
                                            onClick={() => setDeleteTarget(item)}
                                        />
                                    </Popout>
                                )
                            }
                        }
                    ]}
                />
            )}

            {/* Add / Edit Dialog */}
            <Dialog
                open={openForm}
                title={
                    editTarget
                        ? t('recurring.editRecurring', 'Edit Recurring')
                        : t('recurring.addRecurring', 'Add Recurring')
                }
                onCloseDialog={() => {
                    setOpenForm(false)
                    setEditTarget(undefined)
                }}
            >
                <form
                    className={styles.form}
                    onSubmit={handleSubmit(onSubmit)}
                >
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
                            onSelect={(sel) =>
                                setValue('type', (sel?.[0]?.key ?? 'expense') as 'income' | 'expense')
                            }
                        />

                        <Select<string>
                            label={t('recurring.frequency.monthly', 'Frequency')}
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
                        placeholder={t('recurring.endDate', 'End Date')}
                        onDateSelect={(date) => setValue('end_date', date)}
                    />

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
                </form>
            </Dialog>

            {/* Delete confirmation dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('recurring.deleteConfirmTitle', 'Delete Recurring Transaction')}
                onCloseDialog={() => setDeleteTarget(undefined)}
            >
                <Message type='warning'>
                    {t(
                        'recurring.deleteConfirmBody',
                        'Are you sure you want to delete this recurring transaction?'
                    )}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeleting ? '...' : t('common.delete', 'Delete')}
                    onClick={handleDelete}
                    disabled={isDeleting}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setDeleteTarget(undefined)}
                    stretched
                />
            </Dialog>
        </AppLayout>
    )
}
