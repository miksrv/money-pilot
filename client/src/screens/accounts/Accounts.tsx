import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Container, Dialog, Input, Message, Popout, Select } from 'simple-react-ui-kit'

import {
    ApiModel,
    useAddAccountMutation,
    useDeleteAccountMutation,
    useGetGroupMembersQuery,
    useGetProfileQuery,
    useListAccountQuery,
    useListGroupsQuery,
    useUpdateAccountMutation
} from '@/api'
import { AppLayout, Currency, CurrencyInput } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

type AccountFormData = Pick<ApiModel.Account, 'name' | 'type' | 'balance' | 'institution'>

const DEFAULT_FORM: AccountFormData = {
    name: '',
    type: 'checking',
    balance: 0,
    institution: ''
}

export const Accounts: React.FC = () => {
    const { t, i18n } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.accounts', 'Accounts')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const { data: groups } = useListGroupsQuery(undefined, { skip: !isAuth })
    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })
    const { data: groupMembers } = useGetGroupMembersQuery(activeGroupId ?? '', {
        skip: !isAuth || !activeGroupId
    })

    const activeGroup = activeGroupId ? (groups?.find((g) => g.id === activeGroupId) ?? null) : null
    const myMember = groupMembers?.find((m) => m.user_id === profile?.id)
    const isViewer = activeGroup
        ? activeGroup.owner_id !== profile?.id && (myMember?.role ?? 'viewer') === 'viewer'
        : false

    const [openForm, setOpenForm] = useState(false)
    const [editAccount, setEditAccount] = useState<ApiModel.Account | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Account | undefined>()
    const [blockedAccount, setBlockedAccount] = useState<ApiModel.Account | undefined>()

    const {
        data: accounts,
        isLoading,
        isFetching
    } = useListAccountQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const [addAccount, { isLoading: isAdding }] = useAddAccountMutation()
    const [updateAccount, { isLoading: isUpdating }] = useUpdateAccountMutation()
    const [deleteAccount, { isLoading: isDeleting }] = useDeleteAccountMutation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<AccountFormData>({ defaultValues: DEFAULT_FORM })

    const formBalance = watch('balance')
    const formType = watch('type')

    useEffect(() => {
        if (editAccount) {
            reset({
                name: editAccount.name ?? '',
                type: editAccount.type ?? 'checking',
                balance: editAccount.balance ?? 0,
                institution: editAccount.institution ?? ''
            })
        } else {
            reset(DEFAULT_FORM)
        }
    }, [editAccount, openForm])

    const openEdit = (account: ApiModel.Account) => {
        setEditAccount(account)
        setOpenForm(true)
    }

    const handleDeleteClick = (account: ApiModel.Account) => {
        if ((account.transaction_count ?? 0) > 0) {
            setBlockedAccount(account)
        } else {
            setDeleteTarget(account)
        }
    }

    const onSubmit = async (data: AccountFormData) => {
        try {
            if (editAccount?.id) {
                await updateAccount({ id: editAccount.id, ...data }).unwrap()
            } else {
                await addAccount(data).unwrap()
            }
            setOpenForm(false)
            setEditAccount(undefined)
            reset(DEFAULT_FORM)
        } catch (err) {
            console.error('Failed to save account:', err)
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) {
            return
        }
        try {
            await deleteAccount(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
        } catch (err) {
            console.error('Failed to delete account:', err)
        }
    }

    const typeOptions = [
        { key: 'checking', value: t('accounts.type.checking', 'Checking') },
        { key: 'savings', value: t('accounts.type.savings', 'Savings') },
        { key: 'credit', value: t('accounts.type.credit', 'Credit') },
        { key: 'investment', value: t('accounts.type.investment', 'Investment') }
    ]

    const isSaving = isAdding || isUpdating

    return (
        <AppLayout
            actions={
                !isViewer ? (
                    <Button
                        mode='secondary'
                        icon='PlusCircle'
                        onClick={() => {
                            setEditAccount(undefined)
                            setOpenForm(true)
                        }}
                        label={t('accounts.add', 'Add Account')}
                    />
                ) : undefined
            }
        >
            {!isLoading && !isFetching && (!accounts || accounts.length === 0) && (
                <div className={styles.emptyState}>
                    <p>{t('accounts.noAccounts', 'No accounts yet')}</p>
                    <p>{t('accounts.addFirst', 'Add your first account to get started.')}</p>
                </div>
            )}

            <div className={styles.accountsGrid}>
                {accounts?.map((account) => (
                    <Container
                        key={account.id}
                        title={account.name ?? ''}
                        action={
                            !isViewer ? (
                                <Popout
                                    trigger={
                                        <Button
                                            mode='link'
                                            icon='VerticalDots'
                                        />
                                    }
                                    closeOnChildrenClick
                                >
                                    <Button
                                        mode='link'
                                        icon='Pencil'
                                        label={t('accounts.editAccount', 'Edit')}
                                        onClick={() => openEdit(account)}
                                    />
                                    <Button
                                        mode='link'
                                        icon='Close'
                                        variant='negative'
                                        label={t('accounts.deleteAccount', 'Delete')}
                                        onClick={() => handleDeleteClick(account)}
                                    />
                                </Popout>
                            ) : undefined
                        }
                    >
                        <div
                            className={styles.accountBalance}
                            style={{ color: (account.balance ?? 0) >= 0 ? 'var(--color-green)' : 'var(--color-red)' }}
                        >
                            {formatMoney(account.balance ?? 0, profile?.currency ?? 'USD')}
                        </div>
                        <Badge
                            label={t('accounts.type.' + (account.type ?? ''), account.type ?? '')}
                            size='small'
                        />
                        {account.institution && <div className={styles.accountInstitution}>{account.institution}</div>}
                    </Container>
                ))}
            </div>

            {/* Add / Edit Dialog */}
            <Dialog
                open={openForm}
                title={editAccount ? t('accounts.editAccount', 'Edit Account') : t('accounts.add', 'Add Account')}
                onCloseDialog={() => {
                    setOpenForm(false)
                    setEditAccount(undefined)
                    reset(DEFAULT_FORM)
                }}
            >
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        id='name'
                        type='text'
                        size='medium'
                        label={t('accounts.name', 'Name')}
                        placeholder={t('accounts.name', 'Name')}
                        error={errors.name?.message}
                        {...register('name', {
                            required: t('common.required', 'Required')
                        })}
                    />

                    <Select<string>
                        label={t('accounts.type.checking', 'Type')}
                        options={typeOptions}
                        value={formType}
                        onSelect={(items) =>
                            setValue('type', (items?.[0]?.key ?? 'checking') as ApiModel.Account['type'])
                        }
                    />

                    <Input
                        id='institution'
                        type='text'
                        size='medium'
                        label={t('accounts.institution', 'Institution')}
                        placeholder={t('accounts.institution', 'Institution')}
                        {...register('institution')}
                    />

                    <CurrencyInput
                        label={
                            editAccount
                                ? t('accounts.balance', 'Current Balance')
                                : t('accounts.initialBalance', 'Initial Balance')
                        }
                        value={formBalance ?? 0}
                        currency={Currency.USD}
                        locale={i18n.language}
                        allowNegative={true}
                        onValueChange={(val) => setValue('balance', val ?? 0)}
                    />

                    <Button
                        stretched
                        type='submit'
                        mode='primary'
                        label={isSaving ? '...' : t('common.save', 'Save')}
                        disabled={isSaving}
                    />
                </form>
            </Dialog>

            {/* Confirm delete dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('accounts.deleteConfirmTitle', 'Delete account?')}
                onCloseDialog={() => setDeleteTarget(undefined)}
            >
                <Message type='warning'>
                    {t(
                        'accounts.deleteConfirmBody',
                        'This account has no transactions and will be permanently deleted.'
                    )}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeleting ? '...' : t('common.delete', 'Delete')}
                    onClick={handleConfirmDelete}
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

            {/* Blocked delete dialog */}
            <Dialog
                open={!!blockedAccount}
                title={t('accounts.deleteBlockedTitle', 'Cannot delete')}
                onCloseDialog={() => setBlockedAccount(undefined)}
            >
                <Message type='error'>
                    {t(
                        'accounts.deleteBlockedBody',
                        'This account cannot be deleted because it has existing transactions. Please delete or reassign the transactions first.'
                    )}
                </Message>
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setBlockedAccount(undefined)}
                    stretched
                />
            </Dialog>
        </AppLayout>
    )
}
