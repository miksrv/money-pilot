import type { Account } from '../models'

export type Request = Pick<Account, 'name' | 'type' | 'balance' | 'institution'>

export type Response = Account
