export type CategoryType = 'income' | 'expense'

export interface Category {
    id: string
    name: string
    type?: CategoryType
    parent_id?: string
    budget?: number
    expenses?: number
    icon?: string
    color?: string
}
