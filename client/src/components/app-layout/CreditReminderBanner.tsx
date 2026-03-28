import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'simple-react-ui-kit'

import { ApiModel } from '@/api'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

interface CreditReminderBannerProps {
    account: ApiModel.Account
    daysUntil: number
    currency: string
    onDismiss: () => void
    onPayNow: () => void
}

export const CreditReminderBanner: React.FC<CreditReminderBannerProps> = ({
    account,
    daysUntil,
    currency,
    onDismiss,
    onPayNow
}) => {
    const { t } = useTranslation()

    const dueLabel =
        daysUntil === 0
            ? t('creditReminder.dueToday', 'Due today')
            : t('creditReminder.dueInDays', 'Due in {{count}} days', { count: daysUntil })

    return (
        <div className={styles.creditReminderBanner}>
            <span className={styles.creditReminderIcon}>⚠️</span>
            <span className={styles.creditReminderText}>
                <strong>{account.name}</strong>
                {account.institution && <> · {account.institution}</>}
                {' · '}
                {t('creditReminder.balance', 'Balance')}: {formatMoney(Math.abs(account.balance ?? 0), currency)}
                {' · '}
                {dueLabel}
            </span>
            <div className={styles.creditReminderActions}>
                <Button
                    mode='primary'
                    size='small'
                    label={t('creditReminder.payNow', 'Pay now')}
                    onClick={onPayNow}
                />
                <Button
                    mode='link'
                    size='small'
                    label={t('creditReminder.dismiss', 'Dismiss')}
                    onClick={onDismiss}
                />
            </div>
        </div>
    )
}
