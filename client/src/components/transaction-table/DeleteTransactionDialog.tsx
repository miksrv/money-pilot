import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Dialog, Message } from 'simple-react-ui-kit'

import { ApiModel, useDeleteTransactionMutation } from '@/api'

interface DeleteTransactionDialogProps {
    transaction: ApiModel.Transaction | undefined
    onClose: () => void
    onDeleted: () => void
}

export const DeleteTransactionDialog: React.FC<DeleteTransactionDialogProps> = ({
    transaction,
    onClose,
    onDeleted
}) => {
    const { t } = useTranslation()
    const [deleteError, setDeleteError] = useState(false)
    const [deleteTransaction, { isLoading: isDeleting }] = useDeleteTransactionMutation()

    const handleDeleteConfirm = async () => {
        if (!transaction?.id) {
            return
        }
        setDeleteError(false)
        try {
            await deleteTransaction(transaction.id).unwrap()
            onDeleted()
        } catch {
            setDeleteError(true)
        }
    }

    const handleClose = () => {
        setDeleteError(false)
        onClose()
    }

    return (
        <Dialog
            open={!!transaction}
            title={t('transactions.deleteConfirmTitle', 'Delete transaction?')}
            onCloseDialog={handleClose}
        >
            <Message type='warning'>
                {t('transactions.confirmDelete', 'Are you sure you want to delete this transaction?')}
            </Message>
            {deleteError && <Message type='error'>{t('common.errors.unknown', 'An unknown error occurred')}</Message>}
            <Button
                mode='primary'
                variant='negative'
                label={
                    isDeleting
                        ? t('common.loading', 'Loading...')
                        : t('transactions.deleteTransaction', 'Delete Transaction')
                }
                onClick={() => void handleDeleteConfirm()}
                disabled={isDeleting}
                stretched
            />
            <Button
                mode='outline'
                label={t('common.cancel', 'Cancel')}
                onClick={handleClose}
                stretched
            />
        </Dialog>
    )
}
