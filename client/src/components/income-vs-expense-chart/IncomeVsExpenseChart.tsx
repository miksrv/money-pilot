import React from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import ReactECharts from 'echarts-for-react'
import { Container, Message, Skeleton } from 'simple-react-ui-kit'

import { ApiModel } from '@/api'
import { CHART_COLORS, getEChartBaseConfig } from '@/utils/echart'
import { formatMoney } from '@/utils/money'

interface IncomeVsExpenseChartProps {
    monthlyHistory: ApiModel.DashboardMonthHistory[]
    loading?: boolean
    currency?: string
}

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({
    monthlyHistory,
    loading,
    currency = 'USD'
}) => {
    const { t } = useTranslation()
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const baseConfig = getEChartBaseConfig(isDark)

    const barOption = {
        ...baseConfig,
        legend: {
            ...baseConfig.legend,
            data: [t('dashboard.income', 'Income'), t('dashboard.expenses', 'Expenses')]
        },
        tooltip: {
            ...baseConfig.tooltip,
            formatter: (params: Array<{ name: string; seriesName: string; value: number; marker: string }>) => {
                const monthLabel = dayjs(params[0].name).format('MMMM YYYY')
                const items = params
                    .map(
                        (p) =>
                            `<div style="display: flex; justify-content: space-between; color: var(--text-color-secondary)"><div style="font-size: 11px">${p.marker} ${p.seriesName}</div><div style="color: var(--text-color-primary); font-size: 11px">${String(formatMoney(p.value, currency))}</div></div>`
                    )
                    .join('')
                return `<div style="min-width: 150px"><div style="text-transform: capitalize; margin-bottom: 10px">${monthLabel}</div>${items}</div>`
            }
        },
        xAxis: {
            ...baseConfig.xAxis,
            data: monthlyHistory.map((m) => m.month),
            axisLabel: {
                ...baseConfig.xAxis.axisLabel,
                formatter: (value: string) => {
                    const formatted = dayjs(value).format('MMM YYYY')
                    return formatted.charAt(0).toUpperCase() + formatted.slice(1)
                }
            }
        },
        yAxis: baseConfig.yAxis,
        series: [
            {
                name: t('dashboard.income', 'Income'),
                type: 'bar',
                data: monthlyHistory.map((m) => m.income),
                itemStyle: { color: CHART_COLORS.green, borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 24
            },
            {
                name: t('dashboard.expenses', 'Expenses'),
                type: 'bar',
                data: monthlyHistory.map((m) => m.expenses),
                itemStyle: { color: CHART_COLORS.red, borderRadius: [4, 4, 0, 0] },
                barMaxWidth: 24
            }
        ]
    }

    return (
        <Container title={t('dashboard.incomeVsExpense', 'Income vs Expense')}>
            {loading ? (
                <Skeleton style={{ height: '200px', width: '100%' }} />
            ) : !monthlyHistory.length ? (
                <Message type='info'>{t('dashboard.noData', 'No data for this period')}</Message>
            ) : (
                <ReactECharts
                    option={barOption}
                    style={{ height: 200 }}
                />
            )}
        </Container>
    )
}
