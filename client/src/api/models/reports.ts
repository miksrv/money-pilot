export interface ReportParams {
    date_from: string
    date_to: string
    [key: string]: string
}

export interface CategorySpend {
    category_id: string | null
    category_name: string | null
    emoji: string | null
    color: string | null
    total: number
    count: number
}

export interface MonthlyIncomeExpense {
    month: string
    income: number
    expenses: number
    net: number
}

export interface DailySpend {
    date: string
    amount: number
    cumulative: number
}

export interface MonthlyNetWorth {
    month: string
    net_worth: number
}

export interface PayeeSpend {
    payee_name: string | null
    total: number
    count: number
}
