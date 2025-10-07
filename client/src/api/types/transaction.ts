import type { Transaction } from '../models'

export type Request = Pick<
    Transaction,
    'account_id' | 'amount' | 'type' | 'date' | 'description' | 'category_id' | 'payee_id'
>

export type Response = Transaction
