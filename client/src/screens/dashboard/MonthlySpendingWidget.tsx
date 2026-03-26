import React from 'react'
import { useTranslation } from 'react-i18next'
import * as echarts from 'echarts/core'
import ReactECharts from 'echarts-for-react'
import { Container, Skeleton } from 'simple-react-ui-kit'

import { useGetMonthlySpendingQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

interface TooltipParam {
    dataIndex: number
    value: number | null
    seriesName: string
}

function getStatusColor(current: number, previous: number): string {
    if (previous === 0) {
        return '#4CAF50'
    }

    const ratio = current / previous

    if (ratio <= 1.0) {
        return '#4CAF50'
    }

    if (ratio <= 1.2) {
        return '#FFC107'
    }

    return '#F44336'
}

function colorWithAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
}

interface MonthlySpendingWidgetProps {
    groupId?: string
    currency?: string
}

export const MonthlySpendingWidget: React.FC<MonthlySpendingWidgetProps> = ({ groupId, currency = 'USD' }) => {
    const { t } = useTranslation()
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data, isLoading } = useGetMonthlySpendingQuery(groupId ? { group_id: groupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    if (isLoading || !data) {
        return (
            <Container title={t('dashboard.monthlySpending', 'Monthly Spending')}>
                <Skeleton style={{ height: '180px', width: '100%' }} />
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

    const xAxisDays = Array.from({ length: data.days_in_current_month }, (_, i) => i + 1)

    const currentData = xAxisDays.map((day) => {
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

    const option = {
        grid: {
            left: 8,
            right: 8,
            top: 24,
            bottom: 8,
            containLabel: false
        },
        xAxis: {
            type: 'category',
            data: xAxisDays,
            show: false
        },
        yAxis: {
            type: 'value',
            show: false
        },
        tooltip: {
            trigger: 'axis',
            formatter: (params: TooltipParam[]) => {
                const day = xAxisDays[params[0].dataIndex]
                const lines = params
                    .filter((p) => p.value != null)
                    .map((p) => p.seriesName + ': ' + formatMoney(p.value as number, currency))
                    .join('<br/>')

                return 'Day ' + String(day) + '<br/>' + lines
            }
        },
        series: [
            {
                name: t('dashboard.monthlySpending', 'Monthly Spending'),
                type: 'line',
                smooth: true,
                data: currentData,
                connectNulls: false,
                showSymbol: false,
                lineStyle: { width: 2, color: statusColor },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: colorWithAlpha(statusColor, 0.7) },
                        { offset: 1, color: colorWithAlpha(statusColor, 0) }
                    ])
                },
                markPoint: {
                    data: [
                        {
                            coord: [data.current_day - 1, currentDayValue],
                            symbol: 'circle',
                            symbolSize: 0,
                            label: {
                                show: true,
                                formatter: pctLabel,
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
                name: t('dashboard.vsLastMonth', 'vs last month'),
                type: 'line',
                smooth: true,
                data: previousData,
                connectNulls: false,
                showSymbol: false,
                lineStyle: { type: 'dashed', width: 1.5, color: '#999' },
                areaStyle: {}
            }
        ]
    }

    return (
        <Container title={t('dashboard.monthlySpending', 'Monthly Spending')}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                    fontSize: 13,
                    color: 'var(--input-label-color)'
                }}
            >
                <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-color)' }}>
                    {formatMoney(data.current_month_to_date, currency)}
                </span>
                <span
                    style={{
                        backgroundColor: statusColor,
                        color: '#fff',
                        borderRadius: 10,
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 600
                    }}
                >
                    {pctLabel}
                </span>
                <span>{t('dashboard.vsLastMonth', 'vs last month')}</span>
            </div>
            <ReactECharts
                option={option}
                style={{ height: 180 }}
            />
        </Container>
    )
}
