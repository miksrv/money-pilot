import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Dialog, Input, Message, Skeleton } from 'simple-react-ui-kit'

import { ApiModel, useDeletePayeeMutation, useMergePayeesMutation, useUpdatePayeeMutation } from '@/api'
import { formatDate } from '@/utils/dates'

import styles from './styles.module.sass'

type EditFormData = { name: string }

interface PayeesTableProps {
    payees: ApiModel.Payee[]
    isLoading?: boolean
}

export const PayeesTable: React.FC<PayeesTableProps> = ({ payees, isLoading }) => {
    const { t } = useTranslation()

    const [editTarget, setEditTarget] = useState<ApiModel.Payee | undefined>()
    const [deleteTarget, setDeleteTarget] = useState<ApiModel.Payee | undefined>()
    const [blockedPayee, setBlockedPayee] = useState<ApiModel.Payee | undefined>()
    const [mergeSourceId, setMergeSourceId] = useState<string | null>(null)
    const [mergeTargetPayee, setMergeTargetPayee] = useState<ApiModel.Payee | undefined>()
    const [isMerging, setIsMerging] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteError, setDeleteError] = useState(false)

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
    }, [editTarget, reset])

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

    const handleRowClick = (payee: ApiModel.Payee) => {
        if (mergeSourceId) {
            if (mergeSourceId !== payee.id) {
                setMergeTargetPayee(payee)
            }
        } else {
            setEditTarget(payee)
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
        setDeleteError(false)
        try {
            await deletePayee(deleteTarget.id).unwrap()
            setDeleteTarget(undefined)
        } catch {
            setDeleteError(true)
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

    const renderRow = (payee: ApiModel.Payee) => {
        const isMergeSource = payee.id === mergeSourceId

        return (
            <div
                key={payee.id}
                className={[styles.row, isMergeSource ? styles.rowSelected : ''].join(' ')}
                onClick={() => handleRowClick(payee)}
                role='button'
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        handleRowClick(payee)
                    }
                }}
            >
                {/* Cell 1: Name */}
                <div className={styles.cellName}>
                    <span className={styles.payeeName}>{payee.name}</span>
                </div>

                {/* Cell 2: Usage count */}
                <div className={styles.cellUsage}>
                    <Badge
                        label={String(payee.usage_count)}
                        size='small'
                    />
                </div>

                {/* Cell 3: Last used */}
                <div className={styles.cellLastUsed}>
                    <span className={styles.lastUsedText}>
                        {payee.last_used ? formatDate(payee.last_used, 'DD.MM.YYYY') : '—'}
                    </span>
                </div>

                {/* Cell 4: Actions */}
                <div
                    className={styles.cellActions}
                    onClick={(e) => e.stopPropagation()}
                >
                    {mergeSourceId && !isMergeSource ? (
                        <Button
                            mode='secondary'
                            size='small'
                            label={t('payees.mergeInto', 'Merge into')}
                            onClick={() => setMergeTargetPayee(payee)}
                        />
                    ) : !mergeSourceId ? (
                        <>
                            <Button
                                mode='link'
                                icon='Link'
                                title={t('payees.mergePayee', 'Merge Payee')}
                                onClick={() => setMergeSourceId(payee.id)}
                            />
                            <Button
                                mode='link'
                                icon='Close'
                                variant='negative'
                                title={t('payees.deletePayee', 'Delete Payee')}
                                onClick={() => handleDeleteClick(payee)}
                            />
                        </>
                    ) : null}
                </div>
            </div>
        )
    }

    const SKELETON_WIDTHS = [60, 40, 75, 55, 65]

    return (
        <div className={styles.tableWrapper}>
            {mergeSourceId && (
                <div className={styles.mergeBar}>
                    <span>
                        {t('payees.selectMergeTarget', 'Select a payee to merge "{{name}}" into', {
                            name: sourcePayee?.name ?? ''
                        })}
                    </span>
                    <Button
                        mode='outline'
                        size='small'
                        label={t('common.cancel', 'Cancel')}
                        onClick={() => setMergeSourceId(null)}
                    />
                </div>
            )}

            {payees.map(renderRow)}

            {isLoading &&
                SKELETON_WIDTHS.map((width, i) => (
                    <div
                        key={i}
                        className={styles.skeletonRow}
                    >
                        <Skeleton style={{ height: 16, width: width + '%', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '32px', borderRadius: 4 }} />
                        <Skeleton style={{ height: 16, width: '18%', borderRadius: 4, marginLeft: 'auto' }} />
                    </div>
                ))}

            {!isLoading && payees.length === 0 && (
                <div className={styles.emptyState}>{t('payees.noPayees', 'No payees found')}</div>
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
                        variant='negative'
                        label={t('payees.deletePayee', 'Delete Payee')}
                        onClick={() => {
                            handleDeleteClick(editTarget!)
                            setEditTarget(undefined)
                        }}
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
                onCloseDialog={() => {
                    setDeleteTarget(undefined)
                    setDeleteError(false)
                }}
            >
                <Message type='warning'>
                    {t('payees.deleteConfirmBody', 'Are you sure you want to delete this payee?')}
                </Message>
                {deleteError && (
                    <Message type='error'>{t('common.errors.unknown', 'An unknown error occurred')}</Message>
                )}
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
        </div>
    )
}
