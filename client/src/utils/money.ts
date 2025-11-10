import i18n from '@/tools/i18n'

export enum Currency {
    RUB = 'RUB',
    USD = 'USD',
    EUR = 'EUR'
}

export const formatMoney = (amount?: number | string | null, currency?: Currency): string =>
    new Intl.NumberFormat(i18n.language, {
        style: 'currency',
        currency: currency || Currency.USD,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount))
