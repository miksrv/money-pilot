export interface MonthlySpendingDay {
    day: number
    cumulative: number
}

export interface MonthlySpendingResponse {
    current_month: MonthlySpendingDay[]
    previous_month: MonthlySpendingDay[]
    current_day: number
    current_month_to_date: number
    previous_month_same_day: number
    days_in_current_month: number
    days_in_previous_month: number
}

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
