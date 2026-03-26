import React from 'react'
import { useTranslation } from 'react-i18next'
import { Container, Skeleton } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

interface SummaryCardProps {
    title: string
    value: string
    current: number
    previous: number
    loading?: boolean
    invertPositive?: boolean
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
    title,
    value,
    current,
    previous,
    loading,
    invertPositive
}) => {
    const { t } = useTranslation()

    const pctChange = previous !== 0 ? ((current - previous) / Math.abs(previous)) * 100 : 0
    const isPositive = invertPositive ? pctChange <= 0 : pctChange >= 0
    const sign = pctChange > 0 ? '+' : ''

    if (loading) {
        return <Skeleton style={{ height: '80px', width: '100%' }} />
    }

    return (
        <Container>
            <div className={styles.summaryCardChange}>{title}</div>
            <div className={styles.summaryCardValue}>{value}</div>
            {previous !== 0 && (
                <div className={styles.summaryCardChange}>
                    <span className={isPositive ? styles.positive : styles.negative}>
                        {sign}
                        {pctChange.toFixed(1)}%
                    </span>{' '}
                    {t('dashboard.vsLastMonth', 'vs last month')}
                </div>
            )}
        </Container>
    )
}
