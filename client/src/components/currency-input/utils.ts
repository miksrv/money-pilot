import { Currency, CURRENCY_CONFIGS, CurrencyConfig } from './types'

/**
 * Get currency configuration by currency code
 */
export function getCurrencyConfig(currency: Currency): CurrencyConfig {
    return CURRENCY_CONFIGS[currency] || CURRENCY_CONFIGS[Currency.USD]
}

/**
 * Format number with thousand separators (without currency symbol)
 */
export function formatNumber(value: number | null | undefined, currency: Currency, locale?: string): string {
    if (value == null || isNaN(value)) {
        return ''
    }

    const config = getCurrencyConfig(currency)
    const displayLocale = locale || config.locale

    return new Intl.NumberFormat(displayLocale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: config.decimals
    }).format(value)
}

/**
 * Parse user input string to number
 * Handles different decimal separators (comma and dot)
 */
export function parseInputValue(input: string): number | null {
    if (!input || input.trim() === '') {
        return null
    }

    // Remove all non-numeric characters except decimal separators
    let cleaned = input.replace(/[^\d.,-]/g, '')

    // Handle different number formats
    // If both comma and dot present, determine which is decimal separator
    const hasComma = cleaned.includes(',')
    const hasDot = cleaned.includes('.')

    if (hasComma && hasDot) {
        // If comma comes after dot (1.234,56) - comma is decimal
        // If dot comes after comma (1,234.56) - dot is decimal
        const lastComma = cleaned.lastIndexOf(',')
        const lastDot = cleaned.lastIndexOf('.')

        if (lastComma > lastDot) {
            // European format: 1.234,56
            cleaned = cleaned.replace(/\./g, '').replace(',', '.')
        } else {
            // US format: 1,234.56
            cleaned = cleaned.replace(/,/g, '')
        }
    } else if (hasComma) {
        // Could be decimal (3,14) or thousand separator (1,000)
        // If 3 digits after comma, it's thousand separator
        const parts = cleaned.split(',')
        if (parts.length === 2 && parts[1].length === 3) {
            // Likely thousand separator
            cleaned = cleaned.replace(/,/g, '')
        } else {
            // Likely decimal separator
            cleaned = cleaned.replace(',', '.')
        }
    }
    // If only dot, keep it as is (standard decimal)

    const num = parseFloat(cleaned)
    return isNaN(num) ? null : num
}
