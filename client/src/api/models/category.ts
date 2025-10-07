export interface Category {
    id: string
    name: string
    type: 'income' | 'expense'
    parent_id: string | null
}
