import { ApiModel } from '@/api'

export const FREQUENCY_KEYS: Array<ApiModel.RecurringTransaction['frequency']> = [
    'daily',
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly'
]
