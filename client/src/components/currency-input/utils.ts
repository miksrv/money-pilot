import { Currency } from './types'

export function getCurrencyFormat(value: number, currency: Currency, locale: string): string {
    if (isNaN(value)) {
        return ''
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
    }).format(value)
}
