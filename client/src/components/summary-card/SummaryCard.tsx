import React from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Skeleton } from 'simple-react-ui-kit'

import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

interface SummaryCardProps {
    title: string
    value: string
    current: number
    previous: number
    loading?: boolean
    invertPositive?: boolean
    currency?: string
    hideDiff?: boolean
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    current,
    previous,
    loading,
    invertPositive,
    currency = 'USD',
    hideDiff
}) => {
    const { t } = useTranslation()

    const diff = current - previous
    const isPositive = invertPositive ? diff <= 0 : diff >= 0
    const sign = diff > 0 ? '+' : ''

    if (loading) {
        return <Skeleton style={{ height: '80px', width: '100%' }} />
    }

    return (
        <Container>
            <div className={styles.summaryCardChange}>{title}</div>
            <div className={styles.summaryCardValue}>{value}</div>
            {previous !== 0 && !hideDiff && (
                <div className={styles.summaryCardChange}>
                    <span className={isPositive ? styles.positive : styles.negative}>
                        {sign}
                        {formatMoney(diff, currency)}
                    </span>{' '}
                    {t('dashboard.vsLastMonth', 'vs last month')}
                </div>
            )}
        </Container>
    )
}
