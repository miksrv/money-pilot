import type { Transaction } from './transaction'

export interface TransactionMeta {
    total: number
    page: number
    limit: number
    pages: number
}

export interface TransactionListResponse {
    data: Transaction[]
    meta: TransactionMeta
}

export interface TransactionListParams {
    [key: string]: string | number | boolean | undefined | null
    page?: number
    limit?: number
    search?: string
    date_from?: string
    date_to?: string
    type?: 'income' | 'expense'
    account_id?: string
    category_id?: string
}
