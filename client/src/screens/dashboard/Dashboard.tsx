import React from 'react'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { Badge, Button, Container, Message, Progress, Skeleton, Table } from 'simple-react-ui-kit'

import {
    ApiModel,
    useGetDashboardSummaryQuery,
    useListAccountQuery,
    useListCategoriesQuery,
    useListTransactionsQuery
} from '@/api'
import { AppLayout, ColorName, getColorHex } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatUTCDate } from '@/utils/dates'
import { Currency, formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

interface SummaryCardProps {
    title: string
    value: string
    current: number
    previous: number
    loading: boolean
    invertPositive?: boolean
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, current, previous, loading, invertPositive }) => {
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

export const Dashboard: React.FC = () => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth)

    const { data: summary, isLoading: summaryLoading } = useGetDashboardSummaryQuery(undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })
    const { data: categories, isLoading: categoriesLoading } = useListCategoriesQuery(
        { withSums: true },
        { refetchOnReconnect: true, skip: !isAuth }
    )
    const { data: transactions, isLoading: transactionsLoading } = useListTransactionsQuery(undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })
    const { data: accounts } = useListAccountQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

    const expenseCategories = categories?.filter((c) => c.type === 'expense' && (c.expenses ?? 0) > 0) ?? []
    const totalExpenses = expenseCategories.reduce((sum, c) => sum + (c.expenses ?? 0), 0)

    const doughnutOption = {
        tooltip: { trigger: 'item' },
        series: [
            {
                type: 'pie',
                radius: ['40%', '70%'],
                data: expenseCategories.map((c) => ({
                    value: c.expenses,
                    name: [c.icon ?? '', c.name ?? ''].join(' ')
                }))
            }
        ]
    }

    const barOption = {
        tooltip: { trigger: 'axis' },
        legend: { data: [t('dashboard.income', 'Income'), t('dashboard.expenses', 'Expenses')] },
        xAxis: { type: 'category', data: summary?.monthly_history.map((m) => m.month) ?? [] },
        yAxis: { type: 'value' },
        series: [
            {
                name: t('dashboard.income', 'Income'),
                type: 'bar',
                data: summary?.monthly_history.map((m) => m.income) ?? [],
                color: '#4bb34b'
            },
            {
                name: t('dashboard.expenses', 'Expenses'),
                type: 'bar',
                data: summary?.monthly_history.map((m) => m.expenses) ?? [],
                color: '#e64646'
            }
        ]
    }

    const recentTransactions = transactions?.data?.slice(0, 10)

    return (
        <AppLayout>
            <div className={styles.dashboard}>
                {/* Summary cards */}
                <div className={styles.summaryCards}>
                    <SummaryCard
                        title={t('dashboard.netWorth', 'Net Worth')}
                        value={formatMoney(summary?.net_worth ?? 0, Currency.USD)}
                        current={summary?.net_worth ?? 0}
                        previous={
                            (summary?.net_worth ?? 0) -
                            (summary?.current_month.income ?? 0) +
                            (summary?.current_month.expenses ?? 0)
                        }
                        loading={summaryLoading}
                    />
                    <SummaryCard
                        title={t('dashboard.spentThisMonth', 'Spent This Month')}
                        value={formatMoney(summary?.current_month.expenses ?? 0, Currency.USD)}
                        current={summary?.current_month.expenses ?? 0}
                        previous={summary?.previous_month.expenses ?? 0}
                        loading={summaryLoading}
                        invertPositive
                    />
                    <SummaryCard
                        title={t('dashboard.incomeThisMonth', 'Income This Month')}
                        value={formatMoney(summary?.current_month.income ?? 0, Currency.USD)}
                        current={summary?.current_month.income ?? 0}
                        previous={summary?.previous_month.income ?? 0}
                        loading={summaryLoading}
                    />
                    <SummaryCard
                        title={t('dashboard.savingsRate', 'Savings Rate')}
                        value={(summary?.current_month.savings_rate ?? 0).toFixed(1) + '%'}
                        current={summary?.current_month.savings_rate ?? 0}
                        previous={summary?.previous_month.savings_rate ?? 0}
                        loading={summaryLoading}
                    />
                </div>

                {/* Charts row */}
                <div className={styles.chartsRow}>
                    {/* Spending by category doughnut */}
                    <Container title={t('dashboard.spendingByCategory', 'Spending by Category')}>
                        {categoriesLoading ? (
                            <Skeleton style={{ height: '250px', width: '100%' }} />
                        ) : expenseCategories.length === 0 ? (
                            <Message type='info'>{t('dashboard.noData', 'No data for this period')}</Message>
                        ) : (
                            <>
                                <ReactECharts
                                    option={doughnutOption}
                                    style={{ height: 250 }}
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
                                                {formatMoney(c.expenses ?? 0, Currency.USD)}
                                            </span>
                                            <Progress
                                                value={
                                                    totalExpenses > 0 ? ((c.expenses ?? 0) / totalExpenses) * 100 : 0
                                                }
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

                    {/* Income vs Expense bar chart */}
                    <Container title={t('dashboard.incomeVsExpense', 'Income vs Expense')}>
                        {summaryLoading ? (
                            <Skeleton style={{ height: '250px', width: '100%' }} />
                        ) : !summary?.monthly_history?.length ? (
                            <Message type='info'>{t('dashboard.noData', 'No data for this period')}</Message>
                        ) : (
                            <ReactECharts
                                option={barOption}
                                style={{ height: 250 }}
                            />
                        )}
                    </Container>
                </div>

                {/* Recent transactions */}
                <Container
                    title={t('dashboard.recentTransactions', 'Recent Transactions')}
                    action={
                        <Button
                            mode='link'
                            label={t('dashboard.viewAll', 'View all')}
                            link='/transactions'
                        />
                    }
                >
                    {transactionsLoading ? (
                        <Skeleton style={{ height: '250px', width: '100%' }} />
                    ) : !recentTransactions?.length ? (
                        <Message type='info'>{t('dashboard.noTransactions', 'No transactions yet')}</Message>
                    ) : (
                        <Table<ApiModel.Transaction>
                            data={recentTransactions}
                            columns={[
                                {
                                    header: t('transactions.date', 'Date'),
                                    accessor: 'date',
                                    formatter: (value) => formatUTCDate(value as string, 'DD.MM.YYYY')
                                },
                                {
                                    header: t('transactions.payee', 'Payee'),
                                    accessor: 'payee'
                                },
                                {
                                    header: t('transactions.category', 'Category'),
                                    accessor: 'category_id',
                                    formatter: (value) => {
                                        const category = categories?.find((cat) => cat.id === value)

                                        if (!category) {
                                            return t('transactions.noCategory', 'No category')
                                        }

                                        return (
                                            <Badge
                                                size='small'
                                                icon={<>{category.icon}</>}
                                                key={category.id}
                                                label={category.name}
                                                style={{ backgroundColor: getColorHex(category?.color as ColorName) }}
                                            />
                                        )
                                    }
                                },
                                {
                                    header: t('transactions.account', 'Account'),
                                    accessor: 'account_id',
                                    formatter: (value) => accounts?.find((acc) => acc.id === value)?.name ?? ''
                                },
                                {
                                    header: t('transactions.amount', 'Amount'),
                                    accessor: 'amount',
                                    formatter: (value, rows, index) => {
                                        const transaction = rows[index]
                                        const isIncome = transaction?.type === 'income'

                                        return (
                                            <span className={isIncome ? styles.positive : styles.negative}>
                                                {isIncome ? '+' : '-'}
                                                {formatMoney(value as number, Currency.USD)}
                                            </span>
                                        )
                                    }
                                }
                            ]}
                        />
                    )}
                </Container>
            </div>
        </AppLayout>
    )
}
