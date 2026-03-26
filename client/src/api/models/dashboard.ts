export interface DashboardMonthStats {
    income: number
    expenses: number
    savings_rate: number
}

export interface DashboardMonthHistory {
    month: string
    income: number
    expenses: number
}

export interface DashboardSummary {
    net_worth: number
    current_month: DashboardMonthStats
    previous_month: DashboardMonthStats
    monthly_history: DashboardMonthHistory[]
}
