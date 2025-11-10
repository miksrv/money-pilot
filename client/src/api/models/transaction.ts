export interface Transaction {
    id: string
    user_id: string
    account_id: string
    category_id?: string
    payee: string | null
    amount: number
    type: 'income' | 'expense'
    date: string
    created_at: string
    updated_at: string
}
