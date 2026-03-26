import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Dialog, Input, Message, Popout, Table } from 'simple-react-ui-kit'

import {
    ApiModel,
    useDeletePayeeMutation,
    useListPayeesQuery,
    useMergePayeesMutation,
    useUpdatePayeeMutation
} from '@/api'
import { AppLayout } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatDate } from '@/utils/dates'

import styles from './styles.module.sass'

type EditFormData = { name: string }

export const Payees: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.payees', 'Payees')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [editTarget, setEditTarget] = useState<ApiModel.Payee | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Payee | undefined>()
    const [blockedPayee, setBlockedPayee] = useState<ApiModel.Payee | undefined>()
    const [mergeSourceId, setMergeSourceId] = useState<string | null>(null)
    const [mergeTargetPayee, setMergeTargetPayee] = useState<ApiModel.Payee | undefined>()
    const [isMerging, setIsMerging] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const { data: payees, isLoading } = useListPayeesQuery(debouncedSearch ? { search: debouncedSearch } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const [updatePayee, { isLoading: isUpdating }] = useUpdatePayeeMutation()
    const [deletePayee] = useDeletePayeeMutation()
    const [mergePayees] = useMergePayeesMutation()

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<EditFormData>({ defaultValues: { name: '' } })

    useEffect(() => {
        if (editTarget) {
            reset({ name: editTarget.name })
        }
    }, [editTarget])

    const onEditSubmit = async (data: EditFormData) => {
        if (!editTarget?.id) {
            return
        }
        try {
            await updatePayee({ id: editTarget.id, name: data.name }).unwrap()
            setEditTarget(undefined)
        } catch {
            // silent
        }
    }

    const handleDeleteClick = (payee: ApiModel.Payee) => {
        if (payee.usage_count > 0) {
            setBlockedPayee(payee)
        } else {
            setDeleteTarget(payee)
        }
    }

    const handleConfirmDelete = async () => {
        if (!deleteTarget?.id) {
            return
        }
        setIsDeleting(true)
        try {
            await deletePayee(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
        } catch {
            // silent
        } finally {
            setIsDeleting(false)
        }
    }

    const handleMergeConfirm = async () => {
        if (!mergeSourceId || !mergeTargetPayee?.id) {
            return
        }
        setIsMerging(true)
        try {
            await mergePayees({ sourceId: mergeSourceId, targetId: mergeTargetPayee.id }).unwrap()
            setMergeSourceId(null)
            setMergeTargetPayee(undefined)
        } catch {
            // silent
        } finally {
            setIsMerging(false)
        }
    }

    const sourcePayee = payees?.find((p) => p.id === mergeSourceId)

    return (
        <AppLayout>
            <div className={styles.header}>
                <div className={styles.searchInput}>
                    <Input
                        id='payee-search'
                        type='text'
                        size='medium'
                        placeholder={t('payees.searchPayees', 'Search payees...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                {mergeSourceId && (
                    <Button
                        mode='outline'
                        label={t('common.cancel', 'Cancel')}
                        onClick={() => setMergeSourceId(null)}
                    />
                )}
            </div>

            {!isLoading && (!payees || payees.length === 0) && (
                <div className={styles.emptyState}>
                    <Message type='info'>{t('payees.noPayees', 'No payees found')}</Message>
                </div>
            )}

            {payees && payees.length > 0 && (
                <Table<ApiModel.Payee>
                    loading={isLoading}
                    data={payees}
                    columns={[
                        {
                            header: t('accounts.name', 'Name'),
                            accessor: 'name',
                            formatter: (_value, rows, index) => {
                                const payee = rows[index]
                                const isMergeSource = payee.id === mergeSourceId
                                return <span style={{ fontWeight: isMergeSource ? 700 : undefined }}>{payee.name}</span>
                            }
                        },
                        {
                            header: t('payees.usageCount', 'Usage'),
                            accessor: 'usage_count',
                            formatter: (value) => (
                                <Badge
                                    label={String(value)}
                                    size='small'
                                />
                            )
                        },
                        {
                            header: t('payees.lastUsed', 'Last Used'),
                            accessor: 'last_used',
                            formatter: (value) => (value ? (formatDate(value as string, 'DD.MM.YYYY') ?? '—') : '—')
                        },
                        {
                            header: '',
                            accessor: 'id',
                            formatter: (_value, rows, index) => {
                                const payee = rows[index]
                                const isMergeSource = payee.id === mergeSourceId

                                if (mergeSourceId && !isMergeSource) {
                                    return (
                                        <Button
                                            mode='secondary'
                                            className={styles.mergeIntoButton}
                                            label={t('payees.mergePayee', 'Merge into') + ' \u2192'}
                                            onClick={() => setMergeTargetPayee(payee)}
                                        />
                                    )
                                }

                                return (
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
                                            label={t('payees.editPayee', 'Edit Payee')}
                                            onClick={() => setEditTarget(payee)}
                                        />
                                        <Button
                                            mode='link'
                                            label={t('payees.mergePayee', 'Merge Payee')}
                                            onClick={() => setMergeSourceId(payee.id)}
                                        />
                                        <Button
                                            mode='link'
                                            icon='Close'
                                            variant='negative'
                                            label={t('payees.deletePayee', 'Delete Payee')}
                                            onClick={() => handleDeleteClick(payee)}
                                        />
                                    </Popout>
                                )
                            }
                        }
                    ]}
                />
            )}

            {/* Edit dialog */}
            <Dialog
                open={!!editTarget}
                title={t('payees.editPayee', 'Edit Payee')}
                onCloseDialog={() => setEditTarget(undefined)}
            >
                <form onSubmit={handleSubmit(onEditSubmit)}>
                    <Input
                        id='payee-name-edit'
                        type='text'
                        size='medium'
                        label={t('accounts.name', 'Name')}
                        placeholder={t('payees.newPayeePlaceholder', 'Type payee name...')}
                        error={errors.name?.message}
                        {...register('name', { required: t('common.required', 'Required') })}
                    />
                    <Button
                        stretched
                        type='submit'
                        mode='primary'
                        label={isUpdating ? '...' : t('common.save', 'Save')}
                        disabled={isUpdating}
                    />
                    <Button
                        stretched
                        mode='outline'
                        label={t('common.cancel', 'Cancel')}
                        onClick={() => setEditTarget(undefined)}
                    />
                </form>
            </Dialog>

            {/* Merge confirmation dialog */}
            <Dialog
                open={!!mergeTargetPayee}
                title={t('payees.mergeConfirmTitle', 'Merge Payees')}
                onCloseDialog={() => setMergeTargetPayee(undefined)}
            >
                <Message type='warning'>
                    {t(
                        'payees.mergeConfirmBody',
                        'All transactions from {{source}} will be reassigned to {{target}}. This cannot be undone.',
                        {
                            source: sourcePayee?.name ?? '',
                            target: mergeTargetPayee?.name ?? ''
                        }
                    )}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={isMerging ? '...' : t('payees.mergePayee', 'Merge Payee')}
                    onClick={handleMergeConfirm}
                    disabled={isMerging}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setMergeTargetPayee(undefined)}
                    stretched
                />
            </Dialog>

            {/* Confirm delete dialog */}
            <Dialog
                open={!!deleteTarget}
                title={t('payees.deleteConfirmTitle', 'Delete Payee')}
                onCloseDialog={() => setDeleteTarget(undefined)}
            >
                <Message type='warning'>
                    {t('payees.deleteConfirmBody', 'Are you sure you want to delete this payee?')}
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
                open={!!blockedPayee}
                title={t('payees.deleteConfirmTitle', 'Delete Payee')}
                onCloseDialog={() => setBlockedPayee(undefined)}
            >
                <Message type='error'>
                    {t(
                        'payees.deleteBlockedBody',
                        'This payee cannot be deleted because it is used in {{count}} transaction(s).',
                        {
                            count: blockedPayee?.usage_count ?? 0
                        }
                    )}
                </Message>
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setBlockedPayee(undefined)}
                    stretched
                />
            </Dialog>
        </AppLayout>
    )
}
