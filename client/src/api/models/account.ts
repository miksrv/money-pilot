export interface Account {
    id?: string
    user_id?: string
    group_id?: string | null
    name?: string
    type?: 'checking' | 'savings' | 'credit' | 'investment'
    balance?: number
    institution?: string | null
    last_synced: string | null
}
