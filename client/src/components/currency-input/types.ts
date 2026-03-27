export enum Currency {
    RUB = 'RUB',
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    JPY = 'JPY',
    CNY = 'CNY',
    KZT = 'KZT',
    UAH = 'UAH',
    BYN = 'BYN',
    TRY = 'TRY'
}

export interface CurrencyConfig {
    code: Currency
    symbol: string
    name: string
    locale: string
    decimals: number
    symbolPosition: 'before' | 'after'
}

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
    [Currency.USD]: {
        code: Currency.USD,
        symbol: '$',
        name: 'US Dollar',
        locale: 'en-US',
        decimals: 2,
        symbolPosition: 'before'
    },
    [Currency.EUR]: {
        code: Currency.EUR,
        symbol: '€',
        name: 'Euro',
        locale: 'de-DE',
        decimals: 2,
        symbolPosition: 'after'
    },
    [Currency.RUB]: {
        code: Currency.RUB,
        symbol: '₽',
        name: 'Russian Ruble',
        locale: 'ru-RU',
        decimals: 2,
        symbolPosition: 'after'
    },
    [Currency.GBP]: {
        code: Currency.GBP,
        symbol: '£',
        name: 'British Pound',
        locale: 'en-GB',
        decimals: 2,
        symbolPosition: 'before'
    },
    [Currency.JPY]: {
        code: Currency.JPY,
        symbol: '¥',
        name: 'Japanese Yen',
        locale: 'ja-JP',
        decimals: 0,
        symbolPosition: 'before'
    },
    [Currency.CNY]: {
        code: Currency.CNY,
        symbol: '¥',
        name: 'Chinese Yuan',
        locale: 'zh-CN',
        decimals: 2,
        symbolPosition: 'before'
    },
    [Currency.KZT]: {
        code: Currency.KZT,
        symbol: '₸',
        name: 'Kazakhstani Tenge',
        locale: 'kk-KZ',
        decimals: 2,
        symbolPosition: 'after'
    },
    [Currency.UAH]: {
        code: Currency.UAH,
        symbol: '₴',
        name: 'Ukrainian Hryvnia',
        locale: 'uk-UA',
        decimals: 2,
        symbolPosition: 'after'
    },
    [Currency.BYN]: {
        code: Currency.BYN,
        symbol: 'Br',
        name: 'Belarusian Ruble',
        locale: 'be-BY',
        decimals: 2,
        symbolPosition: 'after'
    },
    [Currency.TRY]: {
        code: Currency.TRY,
        symbol: '₺',
        name: 'Turkish Lira',
        locale: 'tr-TR',
        decimals: 2,
        symbolPosition: 'after'
    }
}
