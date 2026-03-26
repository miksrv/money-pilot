import i18n from '@/tools/i18n'

/**
 * Supported currency codes (ISO 4217)
 */
export enum Currency {
    USD = 'USD',
    EUR = 'EUR',
    GBP = 'GBP',
    JPY = 'JPY',
    CAD = 'CAD',
    AUD = 'AUD',
    CHF = 'CHF',
    CNY = 'CNY',
    INR = 'INR',
    RUB = 'RUB',
    BRL = 'BRL',
    MXN = 'MXN',
    KRW = 'KRW',
    SGD = 'SGD',
    HKD = 'HKD',
    NOK = 'NOK',
    SEK = 'SEK',
    PLN = 'PLN',
    TRY = 'TRY',
    AED = 'AED'
}

/**
 * Mapping of currency codes to their native locales for proper formatting.
 * This ensures currency symbols and formatting follow local conventions.
 */
const CURRENCY_LOCALE_MAP: Record<Currency, string> = {
    [Currency.USD]: 'en-US',
    [Currency.EUR]: 'de-DE',
    [Currency.GBP]: 'en-GB',
    [Currency.JPY]: 'ja-JP',
    [Currency.CAD]: 'en-CA',
    [Currency.AUD]: 'en-AU',
    [Currency.CHF]: 'de-CH',
    [Currency.CNY]: 'zh-CN',
    [Currency.INR]: 'en-IN',
    [Currency.RUB]: 'ru-RU',
    [Currency.BRL]: 'pt-BR',
    [Currency.MXN]: 'es-MX',
    [Currency.KRW]: 'ko-KR',
    [Currency.SGD]: 'en-SG',
    [Currency.HKD]: 'zh-HK',
    [Currency.NOK]: 'nb-NO',
    [Currency.SEK]: 'sv-SE',
    [Currency.PLN]: 'pl-PL',
    [Currency.TRY]: 'tr-TR',
    [Currency.AED]: 'ar-AE'
}

/**
 * Currencies that don't use decimal places (e.g., JPY, KRW)
 */
const ZERO_DECIMAL_CURRENCIES: Currency[] = [Currency.JPY, Currency.KRW]

/**
 * Get localized currency options for select dropdowns.
 * Uses i18n for currency names.
 */
export const getCurrencyOptions = (): Array<{ key: string; value: string }> => [
    { key: Currency.USD, value: `USD — ${String(i18n.t('currency.USD', 'US Dollar'))}` },
    { key: Currency.EUR, value: `EUR — ${String(i18n.t('currency.EUR', 'Euro'))}` },
    { key: Currency.GBP, value: `GBP — ${String(i18n.t('currency.GBP', 'British Pound'))}` },
    { key: Currency.JPY, value: `JPY — ${String(i18n.t('currency.JPY', 'Japanese Yen'))}` },
    { key: Currency.CAD, value: `CAD — ${String(i18n.t('currency.CAD', 'Canadian Dollar'))}` },
    { key: Currency.AUD, value: `AUD — ${String(i18n.t('currency.AUD', 'Australian Dollar'))}` },
    { key: Currency.CHF, value: `CHF — ${String(i18n.t('currency.CHF', 'Swiss Franc'))}` },
    { key: Currency.CNY, value: `CNY — ${String(i18n.t('currency.CNY', 'Chinese Yuan'))}` },
    { key: Currency.INR, value: `INR — ${String(i18n.t('currency.INR', 'Indian Rupee'))}` },
    { key: Currency.RUB, value: `RUB — ${String(i18n.t('currency.RUB', 'Russian Ruble'))}` },
    { key: Currency.BRL, value: `BRL — ${String(i18n.t('currency.BRL', 'Brazilian Real'))}` },
    { key: Currency.MXN, value: `MXN — ${String(i18n.t('currency.MXN', 'Mexican Peso'))}` },
    { key: Currency.KRW, value: `KRW — ${String(i18n.t('currency.KRW', 'South Korean Won'))}` },
    { key: Currency.SGD, value: `SGD — ${String(i18n.t('currency.SGD', 'Singapore Dollar'))}` },
    { key: Currency.HKD, value: `HKD — ${String(i18n.t('currency.HKD', 'Hong Kong Dollar'))}` },
    { key: Currency.NOK, value: `NOK — ${String(i18n.t('currency.NOK', 'Norwegian Krone'))}` },
    { key: Currency.SEK, value: `SEK — ${String(i18n.t('currency.SEK', 'Swedish Krona'))}` },
    { key: Currency.PLN, value: `PLN — ${String(i18n.t('currency.PLN', 'Polish Zloty'))}` },
    { key: Currency.TRY, value: `TRY — ${String(i18n.t('currency.TRY', 'Turkish Lira'))}` },
    { key: Currency.AED, value: `AED — ${String(i18n.t('currency.AED', 'UAE Dirham'))}` }
]

/**
 * Format a monetary value according to the currency's native locale and formatting rules.
 *
 * Best practices implemented:
 * - Uses currency's native locale for proper symbol placement and formatting
 * - Handles zero-decimal currencies (JPY, KRW) correctly
 * - Graceful fallback for unsupported currencies
 * - Handles null/undefined/invalid values
 *
 * @param amount - The amount to format (number, string, null, or undefined)
 * @param currency - ISO 4217 currency code (defaults to USD)
 * @returns Formatted currency string
 *
 * @example
 * formatMoney(1234.56, 'USD') // "$1,234.56"
 * formatMoney(1234.56, 'EUR') // "1.234,56 €"
 * formatMoney(1234.56, 'RUB') // "1 234,56 ₽"
 * formatMoney(1234, 'JPY')    // "¥1,234"
 */
export const formatMoney = (amount?: number | string | null, currency?: string): string => {
    const numericAmount = Number(amount) || 0
    const currencyCode = (currency || Currency.USD) as Currency

    // Determine locale: use currency's native locale for proper formatting
    const locale = CURRENCY_LOCALE_MAP[currencyCode] || i18n.language || 'en-US'

    // Determine decimal places based on currency
    const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(currencyCode)
    const fractionDigits = isZeroDecimal ? 0 : 2

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits
        }).format(numericAmount)
    } catch {
        // Fallback for unsupported currencies or old browsers
        const formatted = numericAmount.toFixed(fractionDigits)
        return `${currencyCode} ${formatted}`
    }
}

/**
 * Format money using compact notation for large numbers.
 * Useful for charts and summary cards.
 *
 * @example
 * formatMoneyCompact(1500000, 'USD') // "$1.5M"
 * formatMoneyCompact(1200, 'EUR')    // "1,2K €"
 */
export const formatMoneyCompact = (amount?: number | string | null, currency?: string): string => {
    const numericAmount = Number(amount) || 0
    const currencyCode = (currency || Currency.USD) as Currency
    const locale = CURRENCY_LOCALE_MAP[currencyCode] || i18n.language || 'en-US'

    try {
        return new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: currencyCode,
            notation: 'compact',
            maximumFractionDigits: 1
        }).format(numericAmount)
    } catch {
        // Fallback
        return formatMoney(amount, currency)
    }
}
