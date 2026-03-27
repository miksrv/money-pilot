import type { Transaction } from '../models'

export type Request = Pick<
    Transaction,
    'account_id' | 'amount' | 'type' | 'date' | 'category_id' | 'payee' | 'group_id'
>

export type Response = Transaction
