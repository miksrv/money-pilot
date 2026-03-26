import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { Container, Message, Skeleton } from 'simple-react-ui-kit'

import { ApiModel } from '@/api'
import { CHART_COLORS, getEChartBaseConfig } from '@/utils/echart'

interface IncomeVsExpenseChartProps {
    monthlyHistory: ApiModel.DashboardMonthHistory[]
    loading?: boolean
}

export const IncomeVsExpenseChart: React.FC<IncomeVsExpenseChartProps> = ({ monthlyHistory, loading }) => {
    const { t } = useTranslation()
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const baseConfig = getEChartBaseConfig(isDark)

    const barOption = {
        ...baseConfig,
        legend: {
            ...baseConfig.legend,
            data: [t('dashboard.income', 'Income'), t('dashboard.expenses', 'Expenses')]
        },
        xAxis: {
            ...baseConfig.xAxis,
            data: monthlyHistory.map((m) => m.month)
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
                <Skeleton style={{ height: '250px', width: '100%' }} />
            ) : !monthlyHistory.length ? (
                <Message type='info'>{t('dashboard.noData', 'No data for this period')}</Message>
            ) : (
                <ReactECharts
                    option={barOption}
                    style={{ height: 250 }}
                />
            )}
        </Container>
    )
}
