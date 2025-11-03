export enum Currency {
    RUB = 'RUB',
    USD = 'USD',
    EUR = 'EUR'
}

export const formatMoney = (amount?: number | string | null, currency?: Currency): string =>
    new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: currency || Currency.USD,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(Number(amount))
