export type CategoryType = 'income' | 'expense'

export interface Category {
    id?: string
    name?: string
    type?: CategoryType
    parent_id?: string
    is_parent?: boolean
    budget?: number
    expenses?: number
    icon?: string
    color?: string
    archived?: boolean
    transaction_count?: number
    usage_count?: number
}
