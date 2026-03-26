export interface RecurringTransaction {
    id: string
    user_id: string
    name: string
    type: 'income' | 'expense'
    amount: number
    account_id: string
    category_id: string | null
    payee_name: string | null
    notes: string | null
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
    start_date: string
    end_date: string | null
    next_due_date: string
    is_active: 0 | 1
    auto_create: 0 | 1
    created_at: string
    updated_at: string
}

export interface CreateRecurringBody {
    name: string
    type: 'income' | 'expense'
    amount: number
    account_id: string
    category_id?: string | null
    payee_name?: string | null
    notes?: string | null
    frequency: RecurringTransaction['frequency']
    start_date: string
    end_date?: string | null
    is_active?: 0 | 1
    auto_create?: 0 | 1
    group_id?: string
}
