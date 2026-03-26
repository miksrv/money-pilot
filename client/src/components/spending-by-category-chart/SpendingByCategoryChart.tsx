import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { Container, Message, Progress, Skeleton } from 'simple-react-ui-kit'

import { ApiModel } from '@/api'
import { getEChartBaseConfig, getThemeColors } from '@/utils/echart'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

interface SpendingByCategoryChartProps {
    categories: ApiModel.Category[]
    currency: string
    loading?: boolean
}

export const SpendingByCategoryChart: React.FC<SpendingByCategoryChartProps> = ({ categories, currency, loading }) => {
    const { t } = useTranslation()
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const themeColors = getThemeColors(isDark)
    const baseConfig = getEChartBaseConfig(isDark)

    const expenseCategories = categories.filter((c) => c.type === 'expense' && (c.expenses ?? 0) > 0)
    const totalExpenses = expenseCategories.reduce((sum, c) => sum + (c.expenses ?? 0), 0)

    const doughnutOption = {
        backgroundColor: 'transparent',
        tooltip: {
            ...baseConfig.tooltip,
            trigger: 'item'
        },
        series: [
            {
                type: 'pie',
                radius: ['45%', '75%'],
                center: ['50%', '50%'],
                avoidLabelOverlap: true,
                itemStyle: {
                    borderRadius: 4,
                    borderColor: themeColors.backgroundColor,
                    borderWidth: 2
                },
                label: {
                    show: false
                },
                emphasis: {
                    label: {
                        show: false
                    },
                    itemStyle: {
                        shadowBlur: 10,
                        shadowOffsetX: 0,
                        shadowColor: 'rgba(0, 0, 0, 0.3)'
                    }
                },
                data: expenseCategories.map((c) => ({
                    value: c.expenses,
                    name: [c.icon ?? '', c.name ?? ''].join(' ')
                }))
            }
        ]
    }

    return (
        <Container title={t('dashboard.spendingByCategory', 'Spending by Category')}>
            {loading ? (
                <Skeleton style={{ height: '250px', width: '100%' }} />
            ) : expenseCategories.length === 0 ? (
                <Message type='info'>{t('dashboard.noData', 'No data for this period')}</Message>
            ) : (
                <>
                    <ReactECharts
                        option={doughnutOption}
                        style={{ height: 200 }}
                    />
                    <div className={styles.categoryLegend}>
                        {expenseCategories.map((c) => (
                            <div
                                className={styles.categoryLegendItem}
                                key={c.id}
                            >
                                <span>{c.icon ?? ''}</span>
                                <span className={styles.categoryLegendName}>{c.name ?? ''}</span>
                                <span className={styles.categoryLegendAmount}>
                                    {formatMoney(c.expenses ?? 0, currency)}
                                </span>
                                <Progress
                                    value={totalExpenses > 0 ? ((c.expenses ?? 0) / totalExpenses) * 100 : 0}
                                    height={6}
                                    color='red'
                                    style={{ width: 60 }}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </Container>
    )
}
