export interface Transaction {
    id: string
    user_id: string
    account_id: string
    to_account_id?: string | null
    category_id?: string
    payee: string | null
    amount: number
    type: 'income' | 'expense' | 'transfer'
    date: string
    created_at: string
    updated_at: string
    group_id?: string
}
