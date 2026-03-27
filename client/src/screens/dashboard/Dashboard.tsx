import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Container, Message, Skeleton } from 'simple-react-ui-kit'

import { useGetDashboardSummaryQuery, useGetProfileQuery, useListTransactionsQuery } from '@/api'
import { AppLayout, IncomeVsExpenseChart, MonthlySpendingChart, SummaryCard, TransactionTable } from '@/components'
import { useAppSelector } from '@/store/hooks'
import { formatMoney } from '@/utils/money'

import styles from './styles.module.sass'

export const Dashboard: React.FC = () => {
    const { t } = useTranslation()
    const [openAddForm, setOpenAddForm] = useState(false)

    useEffect(() => {
        document.title = `${t('page.dashboard', 'Dashboard')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })

    const {
        data: summary,
        isLoading: summaryLoading,
        refetch: refetchSummary
    } = useGetDashboardSummaryQuery(activeGroupId ? { group_id: activeGroupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const {
        data: transactions,
        isLoading: transactionsLoading,
        refetch: refetchTransactions
    } = useListTransactionsQuery(activeGroupId ? { group_id: activeGroupId } : { limit: 13, offset: 0 }, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const handleTransactionChange = () => {
        void refetchSummary()
        void refetchTransactions()
    }

    const addButton = (
        <Button
            key='add'
            mode='secondary'
            icon='PlusCircle'
            onClick={() => setOpenAddForm(true)}
            label={t('transactions.add', 'Add Transaction')}
        />
    )

    return (
        <AppLayout actions={[addButton]}>
            <div className={styles.dashboard}>
                <div className={styles.summaryCards}>
                    <SummaryCard
                        title={t('dashboard.netWorth', 'Net Worth')}
                        value={formatMoney(summary?.net_worth ?? 0, profile?.currency ?? 'USD')}
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
                        value={formatMoney(summary?.current_month.expenses ?? 0, profile?.currency ?? 'USD')}
                        current={summary?.current_month.expenses ?? 0}
                        previous={summary?.previous_month.expenses ?? 0}
                        loading={summaryLoading}
                        invertPositive
                    />

                    <SummaryCard
                        title={t('dashboard.incomeThisMonth', 'Income This Month')}
                        value={formatMoney(summary?.current_month.income ?? 0, profile?.currency ?? 'USD')}
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

                <div className={styles.widgets}>
                    <Container
                        title={t('dashboard.recentTransactions', 'Recent Transactions')}
                        className={styles.transactionsContainer}
                        action={
                            <Button
                                mode='outline'
                                icon='External'
                                label={t('dashboard.viewAll', 'View all')}
                                link='/transactions'
                            />
                        }
                    >
                        {transactionsLoading ? (
                            <Skeleton style={{ height: '250px', width: '100%' }} />
                        ) : !transactions?.data?.length ? (
                            <Message type='info'>{t('dashboard.noTransactions', 'No transactions yet')}</Message>
                        ) : (
                            <TransactionTable
                                transactions={transactions?.data}
                                currency={profile?.currency ?? 'USD'}
                                hideGrouping
                                hideCheckboxes
                                onTransactionChange={handleTransactionChange}
                                openAddForm={openAddForm}
                                onCloseAddForm={() => setOpenAddForm(false)}
                            />
                        )}
                    </Container>

                    <div className={styles.chartsContainer}>
                        <MonthlySpendingChart
                            groupId={activeGroupId ?? undefined}
                            currency={profile?.currency ?? 'USD'}
                        />
                        <IncomeVsExpenseChart
                            monthlyHistory={summary?.monthly_history ?? []}
                            loading={summaryLoading}
                            currency={profile?.currency ?? 'USD'}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    )
}
