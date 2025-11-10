import type { Transaction } from '../models'

export type Request = Pick<Transaction, 'account_id' | 'amount' | 'type' | 'date' | 'category_id' | 'payee'>

export type Response = Transaction
