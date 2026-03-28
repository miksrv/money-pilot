import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { Button, DatePicker, Dialog, Message } from 'simple-react-ui-kit'

import { ApiModel, useAddTransactionMutation } from '@/api'
import { AccountSelectField, Currency, CurrencyInput } from '@/components'
import { useAppSelector } from '@/store/hooks'

interface CreditPaymentDialogProps {
    creditAccount: ApiModel.Account
    isOpen: boolean
    onClose: () => void
}

export const CreditPaymentDialog: React.FC<CreditPaymentDialogProps> = ({ creditAccount, isOpen, onClose }) => {
    const { t, i18n } = useTranslation()
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const [fromAccountId, setFromAccountId] = useState('')
    const [amount, setAmount] = useState<number>(Math.abs(creditAccount.balance ?? 0))
    const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'))
    const [error, setError] = useState<string | null>(null)

    const [addTransaction, { isLoading }] = useAddTransactionMutation()

    useEffect(() => {
        if (isOpen) {
            setFromAccountId('')
            setAmount(Math.abs(creditAccount.balance ?? 0))
            setDate(dayjs().format('YYYY-MM-DD'))
            setError(null)
        }
    }, [isOpen, creditAccount.balance])

    const handleSubmit = async () => {
        if (!fromAccountId) {
            setError(t('transfers.fromAccount', 'From account') + ': ' + t('common.required', 'Required'))
            return
        }
        if (!amount || amount <= 0) {
            setError(t('transfers.amount', 'Amount') + ': ' + t('common.required', 'Required'))
            return
        }

        try {
            await addTransaction({
                type: 'transfer',
                account_id: fromAccountId,
                to_account_id: creditAccount.id,
                amount,
                date,
                payee: null,
                category_id: undefined,
                ...(activeGroupId && { group_id: activeGroupId })
            }).unwrap()
            onClose()
        } catch {
            setError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    return (
        <Dialog
            title={t('transfers.paymentDialog', 'Pay credit card')}
            open={isOpen}
            onCloseDialog={onClose}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <AccountSelectField
                    enableAutoSelect={true}
                    excludeId={creditAccount.id}
                    groupId={activeGroupId ?? undefined}
                    value={fromAccountId}
                    placeholder={t('transfers.fromAccount', 'From account')}
                    onSelect={(items) => setFromAccountId(items?.[0]?.key ?? '')}
                />

                <CurrencyInput
                    label={t('transfers.amount', 'Amount')}
                    value={amount}
                    currency={Currency.USD}
                    locale={i18n.language}
                    min={0.01}
                    onValueChange={(val) => setAmount(val ?? 0)}
                />

                <DatePicker
                    datePeriod={[date, date]}
                    locale={i18n.language === 'en' ? 'en' : 'ru'}
                    buttonMode='secondary'
                    placeholder={t('transfers.date', 'Date')}
                    onDateSelect={(d) => setDate(d)}
                />

                {error && <Message type='error'>{error}</Message>}

                <Button
                    mode='primary'
                    stretched
                    label={isLoading ? t('common.loading', 'Loading...') : t('transfers.submit', 'Transfer')}
                    disabled={isLoading}
                    onClick={() => void handleSubmit()}
                />
                <Button
                    mode='outline'
                    stretched
                    label={t('common.cancel', 'Cancel')}
                    onClick={onClose}
                />
            </div>
        </Dialog>
    )
}
