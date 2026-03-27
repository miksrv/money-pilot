import dayjs from 'dayjs'

import { ApiModel } from '@/api'

export const SKELETON_WIDTHS = [80, 60, 70, 55, 65]

export type TransactionFormData = Pick<
    ApiModel.Transaction,
    'account_id' | 'amount' | 'type' | 'date' | 'category_id' | 'payee'
> & {
    notes?: string
}

export const DEFAULT_VALUES: TransactionFormData = {
    account_id: '',
    amount: '' as unknown as number,
    type: 'expense',
    date: dayjs().format('YYYY-MM-DD'),
    category_id: '',
    payee: '',
    notes: ''
}
