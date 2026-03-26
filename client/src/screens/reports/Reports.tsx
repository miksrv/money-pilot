import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { Badge, Button, Container, DatePicker, Message, Skeleton, Table } from 'simple-react-ui-kit'

import {
    ApiModel,
    useGetIncomeExpenseQuery,
    useGetNetWorthQuery,
    useGetSpendingByCategoryQuery,
    useGetSpendingTrendQuery,
    useGetTopPayeesQuery
} from '@/api'
import { AppLayout, Currency } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

type Preset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'custom'

const getPresetRange = (preset: Preset): { date_from: string; date_to: string } => {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (preset === 'thisMonth') {
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'lastMonth') {
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const to = new Date(now.getFullYear(), now.getMonth(), 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'last3Months') {
        const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'last6Months') {
        const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'thisYear') {
        return { date_from: `${now.getFullYear()}-01-01`, date_to: `${now.getFullYear()}-12-31` }
    }
    return { date_from: fmt(now), date_to: fmt(now) }
}

const downloadCsv = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}

export const Reports: React.FC = () => {
    const { t, i18n } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.reports', 'Reports')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const [preset, setPreset] = useState<Preset>('thisMonth')
    const defaultRange = getPresetRange('thisMonth')
    const [customFrom, setCustomFrom] = useState(defaultRange.date_from)
    const [customTo, setCustomTo] = useState(defaultRange.date_to)

    const params: ApiModel.ReportParams =
        preset === 'custom' ? { date_from: customFrom, date_to: customTo } : getPresetRange(preset)

    const skipQuery = !isAuth

    const { data: categoryData, isLoading: catLoading } = useGetSpendingByCategoryQuery(params, {
        skip: skipQuery
    })
    const { data: incomeExpenseData, isLoading: ieLoading } = useGetIncomeExpenseQuery(params, {
        skip: skipQuery
    })
    const { data: trendData, isLoading: trendLoading } = useGetSpendingTrendQuery(params, {
        skip: skipQuery
    })
    const { data: netWorthData, isLoading: nwLoading } = useGetNetWorthQuery(params, {
        skip: skipQuery
    })
    const { data: topPayeesData, isLoading: payeesLoading } = useGetTopPayeesQuery(params, {
        skip: skipQuery
    })

    const presets: Array<{ key: Preset; label: string }> = [
        { key: 'thisMonth', label: t('reports.thisMonth', 'This Month') },
        { key: 'lastMonth', label: t('reports.lastMonth', 'Last Month') },
        { key: 'last3Months', label: t('reports.last3Months', 'Last 3 Months') },
        { key: 'last6Months', label: t('reports.last6Months', 'Last 6 Months') },
        { key: 'thisYear', label: t('reports.thisYear', 'This Year') },
        { key: 'custom', label: t('reports.custom', 'Custom') }
    ]

    const doughnutOption = {
        tooltip: { trigger: 'item' },
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                data: (categoryData ?? []).map((c) => ({
                    value: c.total,
                    name: [c.emoji ?? '', c.category_name ?? t('transactions.noCategory', 'No category')].join(' ')
                }))
            }
        ]
    }

    const barOption = {
        tooltip: { trigger: 'axis' },
        legend: {
            data: [
                t('reports.income', 'Income'),
                t('reports.expense', 'Expenses'),
                t('reports.netSavings', 'Net Savings')
            ]
        },
        xAxis: { type: 'category', data: (incomeExpenseData ?? []).map((m) => m.month) },
        yAxis: { type: 'value' },
        series: [
            {
                name: t('reports.income', 'Income'),
                type: 'bar',
                data: (incomeExpenseData ?? []).map((m) => m.income),
                color: '#4bb34b'
            },
            {
                name: t('reports.expense', 'Expenses'),
                type: 'bar',
                data: (incomeExpenseData ?? []).map((m) => m.expenses),
                color: '#e64646'
            },
            {
                name: t('reports.netSavings', 'Net Savings'),
                type: 'line',
                data: (incomeExpenseData ?? []).map((m) => m.net),
                color: '#5a9eff'
            }
        ]
    }

    const trendOption = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: (trendData ?? []).map((d) => d.date) },
        yAxis: { type: 'value' },
        series: [
            {
                type: 'line',
                areaStyle: {},
                data: (trendData ?? []).map((d) => d.cumulative),
                color: '#e64646'
            }
        ]
    }

    const netWorthOption = {
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: (netWorthData ?? []).map((m) => m.month) },
        yAxis: { type: 'value' },
        series: [
            {
                type: 'line',
                areaStyle: {},
                data: (netWorthData ?? []).map((m) => m.net_worth),
                color: '#4bb34b'
            }
        ]
    }

    const totalCategorySpend = (categoryData ?? []).reduce((s, c) => s + c.total, 0)

    return (
        <AppLayout>
            <div className={styles.reports}>
                {/* Period selector */}
                <div>
                    <div className={styles.presetRow}>
                        {presets.map((p) => (
                            <Button
                                key={p.key}
                                mode={preset === p.key ? 'primary' : 'outline'}
                                label={p.label}
                                onClick={() => setPreset(p.key)}
                            />
                        ))}
                    </div>
                    {preset === 'custom' && (
                        <div className={styles.customDateRow}>
                            <DatePicker
                                datePeriod={[customFrom, customFrom]}
                                locale={i18n.language === 'en' ? 'en' : 'ru'}
                                buttonMode='secondary'
                                placeholder={t('select-date', 'Select date')}
                                onDateSelect={(date) => setCustomFrom(date)}
                            />
                            <DatePicker
                                datePeriod={[customTo, customTo]}
                                locale={i18n.language === 'en' ? 'en' : 'ru'}
                                buttonMode='secondary'
                                placeholder={t('select-date', 'Select date')}
                                onDateSelect={(date) => setCustomTo(date)}
                            />
                        </div>
                    )}
                </div>

                {/* Section 1 — Spending by Category */}
                <Container title={t('reports.spendingByCategory', 'Spending by Category')}>
                    <div className={styles.sectionHeader}>
                        <span />
                        <Button
                            mode='outline'
                            label={t('reports.exportCsv', 'Export CSV')}
                            onClick={() =>
                                downloadCsv(
                                    'spending-by-category.csv',
                                    ['Category', 'Total', 'Count'],
                                    (categoryData ?? []).map((c) => [
                                        c.category_name ?? '',
                                        String(c.total),
                                        String(c.count)
                                    ])
                                )
                            }
                        />
                    </div>
                    {catLoading ? (
                        <Skeleton style={{ height: '250px', width: '100%' }} />
                    ) : !categoryData || categoryData.length === 0 ? (
                        <Message type='info'>{t('reports.noData', 'No data for this period')}</Message>
                    ) : (
                        <>
                            <ReactECharts
                                option={doughnutOption}
                                style={{ height: 250 }}
                            />
                            <div className={styles.categoryLegend}>
                                {categoryData.map((c, i) => (
                                    <div
                                        className={styles.categoryLegendItem}
                                        key={c.category_id ?? i}
                                    >
                                        <span>{c.emoji ?? ''}</span>
                                        <span className={styles.categoryLegendName}>
                                            {c.category_name ?? t('transactions.noCategory', 'No category')}
                                        </span>
                                        <span>{formatMoney(c.total, Currency.USD)}</span>
                                        <span>
                                            {totalCategorySpend > 0
                                                ? ((c.total / totalCategorySpend) * 100).toFixed(1)
                                                : '0'}
                                            %
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </Container>

                {/* Section 2 — Income vs Expense */}
                <Container title={t('reports.incomeVsExpense', 'Income vs Expense')}>
                    <div className={styles.sectionHeader}>
                        <span />
                        <Button
                            mode='outline'
                            label={t('reports.exportCsv', 'Export CSV')}
                            onClick={() =>
                                downloadCsv(
                                    'income-expense.csv',
                                    ['Month', 'Income', 'Expenses', 'Net'],
                                    (incomeExpenseData ?? []).map((m) => [
                                        m.month,
                                        String(m.income),
                                        String(m.expenses),
                                        String(m.net)
                                    ])
                                )
                            }
                        />
                    </div>
                    {ieLoading ? (
                        <Skeleton style={{ height: '250px', width: '100%' }} />
                    ) : !incomeExpenseData || incomeExpenseData.length === 0 ? (
                        <Message type='info'>{t('reports.noData', 'No data for this period')}</Message>
                    ) : (
                        <ReactECharts
                            option={barOption}
                            style={{ height: 280 }}
                        />
                    )}
                </Container>

                {/* Section 3 — Spending Trend */}
                <Container title={t('reports.spendingTrend', 'Spending Trend')}>
                    <div className={styles.sectionHeader}>
                        <span />
                        <Button
                            mode='outline'
                            label={t('reports.exportCsv', 'Export CSV')}
                            onClick={() =>
                                downloadCsv(
                                    'spending-trend.csv',
                                    ['Date', 'Amount', 'Cumulative'],
                                    (trendData ?? []).map((d) => [d.date, String(d.amount), String(d.cumulative)])
                                )
                            }
                        />
                    </div>
                    {trendLoading ? (
                        <Skeleton style={{ height: '250px', width: '100%' }} />
                    ) : !trendData || trendData.length === 0 ? (
                        <Message type='info'>{t('reports.noData', 'No data for this period')}</Message>
                    ) : (
                        <ReactECharts
                            option={trendOption}
                            style={{ height: 250 }}
                        />
                    )}
                </Container>

                {/* Section 4 — Net Worth History */}
                <Container title={t('reports.netWorthHistory', 'Net Worth History')}>
                    <div className={styles.sectionHeader}>
                        <span />
                        <Button
                            mode='outline'
                            label={t('reports.exportCsv', 'Export CSV')}
                            onClick={() =>
                                downloadCsv(
                                    'net-worth.csv',
                                    ['Month', 'Net Worth'],
                                    (netWorthData ?? []).map((m) => [m.month, String(m.net_worth)])
                                )
                            }
                        />
                    </div>
                    {nwLoading ? (
                        <Skeleton style={{ height: '250px', width: '100%' }} />
                    ) : !netWorthData || netWorthData.length === 0 ? (
                        <Message type='info'>{t('reports.noData', 'No data for this period')}</Message>
                    ) : (
                        <ReactECharts
                            option={netWorthOption}
                            style={{ height: 250 }}
                        />
                    )}
                </Container>

                {/* Section 5 — Top Payees */}
                <Container title={t('reports.topPayees', 'Top Payees')}>
                    <div className={styles.sectionHeader}>
                        <span />
                        <Button
                            mode='outline'
                            label={t('reports.exportCsv', 'Export CSV')}
                            onClick={() =>
                                downloadCsv(
                                    'top-payees.csv',
                                    ['Payee', 'Count', 'Total'],
                                    (topPayeesData ?? []).map((p) => [
                                        p.payee_name ?? '',
                                        String(p.count),
                                        String(p.total)
                                    ])
                                )
                            }
                        />
                    </div>
                    {payeesLoading ? (
                        <Skeleton style={{ height: '200px', width: '100%' }} />
                    ) : !topPayeesData || topPayeesData.length === 0 ? (
                        <Message type='info'>{t('reports.noData', 'No data for this period')}</Message>
                    ) : (
                        <Table<ApiModel.PayeeSpend>
                            data={topPayeesData}
                            columns={[
                                {
                                    header: t('reports.rank', 'Rank'),
                                    accessor: 'payee_name',
                                    formatter: (_value, _rows, index) => <span>#{index + 1}</span>
                                },
                                {
                                    header: t('reports.payee', 'Payee'),
                                    accessor: 'payee_name',
                                    formatter: (value) => <span>{(value as string | null) ?? '—'}</span>
                                },
                                {
                                    header: t('reports.transactions', 'Transactions'),
                                    accessor: 'count',
                                    formatter: (value) => (
                                        <Badge
                                            label={String(value)}
                                            size='small'
                                        />
                                    )
                                },
                                {
                                    header: t('reports.total', 'Total'),
                                    accessor: 'total',
                                    formatter: (value) => formatMoney(value as number, Currency.USD)
                                }
                            ]}
                        />
                    )}
                </Container>
            </div>
        </AppLayout>
    )
}
