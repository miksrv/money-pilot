import React, { CSSProperties, useMemo } from 'react'
import { cn } from 'simple-react-ui-kit'

import { formatMoneyParts, formatMoneyPartsCompact } from '@/utils/money'

import styles from './styles.module.sass'

export interface FormattedMoneyProps {
    /** The amount to format */
    amount?: number | string | null
    /** ISO 4217 currency code (defaults to USD) */
    currency?: string
    /** Use compact notation for large numbers (e.g., $1.5M) */
    compact?: boolean
    /** Custom className for the container */
    className?: string
    /** Custom className for the currency symbol */
    symbolClassName?: string
    /** Custom className for the value */
    valueClassName?: string
    /** Font size for the symbol relative to the value (0-1, default 0.7) */
    symbolScale?: number
    /** Custom inline styles for the container */
    style?: CSSProperties
}

/**
 * React component for displaying formatted money with styled currency symbol.
 * The currency symbol is rendered smaller than the value by default.
 *
 * @example
 * // Basic usage
 * <FormattedMoney amount={1234.56} currency="USD" />
 *
 * // Compact notation for large numbers
 * <FormattedMoney amount={1500000} currency="USD" compact />
 *
 * // Custom symbol scale (50% of value size)
 * <FormattedMoney amount={1234.56} currency="EUR" symbolScale={0.5} />
 */
const FormattedMoney: React.FC<FormattedMoneyProps> = ({
    amount,
    currency,
    compact = false,
    className,
    symbolClassName,
    valueClassName,
    symbolScale = 0.9,
    style
}) => {
    const parts = useMemo(() => {
        return compact ? formatMoneyPartsCompact(amount, currency) : formatMoneyParts(amount, currency)
    }, [amount, currency, compact])

    const symbolStyle: CSSProperties = useMemo(
        () => ({
            fontSize: `${symbolScale}em`,
            verticalAlign: 'baseline'
        }),
        [symbolScale]
    )

    return (
        <span
            className={cn(styles.formattedMoney, className)}
            style={style}
        >
            {parts.symbolFirst ? (
                <>
                    <span
                        className={cn(styles.symbol, symbolClassName)}
                        style={symbolStyle}
                    >
                        {parts.symbol}
                    </span>
                    <span className={cn(styles.value, valueClassName)}>{parts.value}</span>
                </>
            ) : (
                <>
                    <span className={cn(styles.value, valueClassName)}>{parts.value}</span>
                    <span
                        className={cn(styles.symbol, symbolClassName)}
                        style={symbolStyle}
                    >
                        {' '}
                        {parts.symbol}
                    </span>
                </>
            )}
        </span>
    )
}

export default FormattedMoney
