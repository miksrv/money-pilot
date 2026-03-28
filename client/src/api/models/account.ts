export interface Account {
    id?: string
    user_id?: string
    name?: string
    type?: 'checking' | 'savings' | 'credit' | 'investment'
    balance?: number
    institution?: string | null
    last_synced: string | null
    transaction_count?: number
    payment_due_day?: number | null
    payment_reminder?: boolean
}
