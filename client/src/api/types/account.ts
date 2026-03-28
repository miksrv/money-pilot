import type { Account } from '../models'

export type Request = Pick<
    Account,
    'name' | 'type' | 'balance' | 'institution' | 'payment_due_day' | 'payment_reminder'
>

export type Response = Account
