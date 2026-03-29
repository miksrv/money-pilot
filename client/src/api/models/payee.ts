export interface Payee {
    id: string
    name: string
    usage_count: number
    last_used: string | null
    default_category_id?: string
    default_account_id?: string | null
}
