import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { Button, Container, Skeleton } from 'simple-react-ui-kit'

import { useGetMonthlySpendingQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'
import { getThemeColors } from '@/utils/echart'
import { formatMoney } from '@/utils/money'

import { getSegmentColor, getStatusColor } from './utils'

import styles from './styles.module.sass'

interface MonthlySpendingChartProps {
    groupId?: string
    currency?: string
}

export const MonthlySpendingChart: React.FC<MonthlySpendingChartProps> = ({ groupId, currency = 'USD' }) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
    const themeColors = getThemeColors(isDark)

    const { data, isLoading } = useGetMonthlySpendingQuery(groupId ? { group_id: groupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    if (isLoading || !data) {
        return (
            <Container title={t('dashboard.monthlySpending', 'Monthly Spending')}>
                <Skeleton style={{ height: '150px', width: '100%' }} />
            </Container>
        )
    }

    const statusColor = getStatusColor(data.current_month_to_date, data.previous_month_same_day)

    const pctDiff =
        data.previous_month_same_day === 0
            ? 0
            : Math.round(
                  ((data.current_month_to_date - data.previous_month_same_day) / data.previous_month_same_day) * 100
              )

    const pctLabel = (pctDiff > 0 ? '+' : '') + pctDiff + '%'
    const amountDiff = data.current_month_to_date - data.previous_month_same_day
    const amountDiffLabel = (amountDiff >= 0 ? '+' : '') + formatMoney(amountDiff, currency)

    const xAxisDays = Array.from({ length: data.days_in_current_month }, (_, i) => i + 1)

    const currentData = xAxisDays.map((day) => {
        if (day > data.current_day) {
            return null
        }

        const found = data.current_month.find((d) => d.day === day)

        return found ? found.cumulative : null
    })

    const previousData = xAxisDays.map((day) => {
        if (day > data.days_in_previous_month) {
            return null
        }

        const found = data.previous_month.find((d) => d.day === day)

        return found ? found.cumulative : null
    })

    const currentDayValue = data.current_month.find((d) => d.day === data.current_day)?.cumulative ?? 0

    // Создаем pieces для visualMap — по одному для каждого сегмента между точками
    const pieces: Array<{ min: number; max: number; color: string }> = []

    for (let i = 0; i < data.current_day - 1; i++) {
        const color = getSegmentColor(currentData[i + 1], previousData[i + 1])

        pieces.push({
            min: i,
            max: i + 1,
            color: color
        })
    }

    const option = {
        backgroundColor: 'transparent',
        grid: {
            left: 0,
            right: 0,
            top: 10,
            bottom: 0,
            containLabel: false
        },
        xAxis: {
            type: 'category',
            data: xAxisDays,
            show: false,
            boundaryGap: false
        },
        yAxis: {
            type: 'value',
            show: false,
            min: 'dataMin',
            max: 'dataMax'
        },
        tooltip: {
            show: false
        },
        visualMap: {
            show: false,
            dimension: 0,
            pieces: pieces,
            seriesIndex: 0
        },
        series: [
            {
                type: 'line',
                smooth: true,
                data: currentData,
                connectNulls: false,
                showSymbol: false,
                lineStyle: { width: 3 },
                markPoint: {
                    data: [
                        {
                            coord: [data.current_day - 1, currentDayValue],
                            symbol: 'circle',
                            symbolSize: 0,
                            label: {
                                show: true,
                                formatter: amountDiffLabel,
                                backgroundColor: statusColor,
                                color: '#fff',
                                borderRadius: 10,
                                padding: [3, 8],
                                fontSize: 11,
                                fontWeight: 600
                            }
                        }
                    ]
                }
            },
            {
                type: 'line',
                smooth: true,
                data: previousData,
                connectNulls: false,
                showSymbol: false,
                lineStyle: { type: 'dashed', width: 1, color: themeColors.textSecondaryColor }
            }
        ]
    }

    return (
        <Container
            title={t('dashboard.monthlySpending', 'Monthly Spending')}
            action={
                <Button
                    mode='link'
                    icon='External'
                    label={t('dashboard.transactions', 'Transactions')}
                    link='/transactions'
                />
            }
        >
            <div className={styles.header}>
                <span
                    className={styles.badge}
                    style={{ backgroundColor: statusColor }}
                >
                    {pctLabel}
                </span>
                <span>{t('dashboard.vsLastMonth', 'vs last month')}</span>
            </div>

            <ReactECharts
                option={option}
                className={styles.chart}
                style={{ height: '170px' }}
                opts={{ renderer: 'svg' }}
                notMerge={true}
            />
        </Container>
    )
}
