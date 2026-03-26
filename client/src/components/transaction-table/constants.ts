import { ApiModel } from '@/api'

export const SKELETON_WIDTHS = [80, 60, 70, 55, 65]

export type TransactionFormData = Pick<
    ApiModel.Transaction,
    'account_id' | 'amount' | 'type' | 'date' | 'category_id' | 'payee'
>

export const DEFAULT_VALUES: TransactionFormData = {
    account_id: '',
    amount: 0,
    type: 'expense',
    date: new Date().toISOString().split('T')[0],
    category_id: '',
    payee: ''
}
