import React, { forwardRef, useCallback, useEffect, useRef, useState } from 'react'

import { Currency } from './types'
import { formatNumber, getCurrencyConfig, parseInputValue } from './utils'

import styles from './styles.module.sass'

export interface CurrencyInputProps {
    /** Current numeric value */
    value?: number | null
    /** Callback when value changes */
    onValueChange?: (value: number | null) => void
    /** Currency code for formatting */
    currency: Currency
    /** Locale for number formatting (optional, uses currency default) */
    locale?: string
    /** Input placeholder text */
    placeholder?: string
    /** Field label */
    label?: string
    /** Error message */
    error?: string
    /** Disabled state */
    disabled?: boolean
    /** Required field indicator */
    required?: boolean
    /**
     * Input size variant.
     * Accepts legacy values ('small' | 'medium' | 'large') and new aliases ('sm' | 'md' | 'lg').
     * Default: 'medium' / 'md'
     */
    size?: 'small' | 'medium' | 'large' | 'sm' | 'md' | 'lg'
    /** Show currency symbol */
    showSymbol?: boolean
    /** Allow negative values */
    allowNegative?: boolean
    /** Minimum allowed value */
    min?: number
    /** Maximum allowed value */
    max?: number
    /** Additional CSS class */
    className?: string
    /** Auto-focus on mount */
    autoFocus?: boolean
    /** Name attribute for forms */
    name?: string
    /** ID attribute */
    id?: string
    /** onBlur callback */
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
    /** onFocus callback */
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
    /**
     * Visual variant.
     * 'default' — standard input style (border, background).
     * 'hero'    — large centered display text, no border, colored by sign.
     * Default: 'default'
     */
    variant?: 'default' | 'hero'
    /**
     * Enable color indication based on value sign (green for positive, red for zero/negative).
     * Only applies when variant='hero'. Default: true
     */
    colorize?: boolean
}

// Normalise legacy size strings to a canonical 3-key set
function resolveSize(size: CurrencyInputProps['size']): 'sm' | 'md' | 'lg' {
    switch (size) {
        case 'small':
        case 'sm':
            return 'sm'
        case 'large':
        case 'lg':
            return 'lg'
        case 'medium':
        case 'md':
        case undefined:
            return 'md'
    }
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    (
        {
            value,
            onValueChange,
            currency,
            locale,
            placeholder,
            label,
            error,
            disabled = false,
            required = false,
            size = 'medium',
            showSymbol = true,
            allowNegative = false,
            min,
            max,
            className,
            autoFocus,
            name,
            id,
            onBlur,
            onFocus,
            variant = 'default',
            colorize = true
        },
        ref
    ) => {
        const config = getCurrencyConfig(currency)
        const displayLocale = locale || config.locale
        const inputRef = useRef<HTMLInputElement>(null)

        const resolvedSize = resolveSize(size)
        const isHero = variant === 'hero'

        // Combine external ref with local ref
        const setRefs = useCallback(
            (node: HTMLInputElement | null) => {
                inputRef.current = node
                if (typeof ref === 'function') {
                    ref(node)
                } else if (ref) {
                    ref.current = node
                }
            },
            [ref]
        )

        const [inputValue, setInputValue] = useState<string>(() => {
            if (value != null && !isNaN(value)) {
                return formatNumber(value, currency, displayLocale)
            }
            return ''
        })

        const [isFocused, setIsFocused] = useState(false)

        const formatForDisplay = useCallback(
            (num: number | null | undefined): string => {
                if (num == null || isNaN(num)) {
                    return ''
                }
                return formatNumber(num, currency, displayLocale)
            },
            [currency, displayLocale]
        )

        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const rawValue = e.target.value
                const allowedChars = allowNegative ? /[^0-9.,\-\s]/g : /[^0-9.,\s]/g
                const sanitized = rawValue.replace(allowedChars, '')

                setInputValue(sanitized)

                const parsed = parseInputValue(sanitized)

                if (parsed != null) {
                    let constrained = parsed
                    if (min !== undefined && parsed < min) {
                        constrained = min
                    }
                    if (max !== undefined && parsed > max) {
                        constrained = max
                    }

                    if (constrained !== parsed) {
                        setInputValue(formatForDisplay(constrained))
                    }

                    onValueChange?.(constrained)
                } else {
                    onValueChange?.(null)
                }
            },
            [allowNegative, min, max, onValueChange, formatForDisplay]
        )

        const handleFocus = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(true)
                setTimeout(() => {
                    inputRef.current?.select()
                }, 0)
                onFocus?.(e)
            },
            [onFocus]
        )

        const handleBlur = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(false)
                const parsed = parseInputValue(inputValue)
                if (parsed != null) {
                    setInputValue(formatForDisplay(parsed))
                } else {
                    setInputValue('')
                }
                onBlur?.(e)
            },
            [inputValue, formatForDisplay, onBlur]
        )

        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent<HTMLInputElement>) => {
                if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
                    return
                }

                const navigationKeys = [
                    'Backspace',
                    'Delete',
                    'Tab',
                    'Escape',
                    'Enter',
                    'ArrowLeft',
                    'ArrowRight',
                    'ArrowUp',
                    'ArrowDown',
                    'Home',
                    'End'
                ]

                if (navigationKeys.includes(e.key)) {
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        const current = parseInputValue(inputValue) || 0
                        const step = e.shiftKey ? 10 : 1
                        const newValue = e.key === 'ArrowUp' ? current + step : current - step

                        let constrained = newValue
                        if (!allowNegative && constrained < 0) {
                            constrained = 0
                        }
                        if (min !== undefined && constrained < min) {
                            constrained = min
                        }
                        if (max !== undefined && constrained > max) {
                            constrained = max
                        }

                        setInputValue(formatForDisplay(constrained))
                        onValueChange?.(constrained)
                    }
                    return
                }

                if (e.key >= '0' && e.key <= '9') {
                    return
                }

                if (e.key === ',' || e.key === '.') {
                    if (inputValue.includes(',') || inputValue.includes('.')) {
                        e.preventDefault()
                    }
                    return
                }

                if (e.key === '-' && allowNegative) {
                    const input = e.target as HTMLInputElement
                    if (input.selectionStart === 0 && !inputValue.includes('-')) {
                        return
                    }
                }

                e.preventDefault()
            },
            [inputValue, allowNegative, min, max, onValueChange, formatForDisplay]
        )

        // Sync with external value changes when not focused
        useEffect(() => {
            if (!isFocused) {
                const newDisplayValue = formatForDisplay(value)
                if (newDisplayValue !== inputValue) {
                    setInputValue(newDisplayValue)
                }
            }
        }, [value, isFocused, formatForDisplay])

        const symbolPosition = showSymbol ? config.symbolPosition : null
        const numericValue = parseInputValue(inputValue)

        // Color class for hero variant
        const heroColorClass =
            isHero && colorize
                ? numericValue != null && numericValue > 0
                    ? styles.heroPositive
                    : styles.heroNeutral
                : ''

        if (isHero) {
            const heroWrapperClasses = [
                styles.heroWrapper,
                styles['hero' + resolvedSize.charAt(0).toUpperCase() + resolvedSize.slice(1)],
                disabled && styles.disabled,
                required && styles.required,
                isFocused && styles.heroFocused,
                className
            ]
                .filter(Boolean)
                .join(' ')

            const heroInputClasses = [styles.heroInput, heroColorClass, error && styles.heroError]
                .filter(Boolean)
                .join(' ')

            const effectivePlaceholder = placeholder ?? '0'

            return (
                <div className={heroWrapperClasses}>
                    {label && <label className={styles.label}>{label}</label>}

                    <div className={styles.heroFieldRow}>
                        {symbolPosition === 'before' && (
                            <span
                                className={[styles.heroCurrency, heroColorClass].filter(Boolean).join(' ')}
                                aria-hidden='true'
                            >
                                {config.symbol}
                            </span>
                        )}

                        <input
                            ref={setRefs}
                            type='text'
                            inputMode='decimal'
                            autoComplete='off'
                            className={heroInputClasses}
                            value={inputValue}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={effectivePlaceholder}
                            disabled={disabled}
                            required={required}
                            name={name}
                            id={id}
                            autoFocus={autoFocus}
                            aria-invalid={!!error}
                            aria-describedby={error ? (id ?? name) + '-error' : undefined}
                            aria-label={label ?? 'Amount'}
                        />

                        {symbolPosition === 'after' && (
                            <span
                                className={[styles.heroCurrency, heroColorClass].filter(Boolean).join(' ')}
                                aria-hidden='true'
                            >
                                {config.symbol}
                            </span>
                        )}
                    </div>

                    {error && (
                        <div
                            className={styles.error}
                            id={(id ?? name) + '-error'}
                            role='alert'
                        >
                            {error}
                        </div>
                    )}
                </div>
            )
        }

        // Default variant — original input style, fully backwards-compatible
        const containerClasses = [
            styles.currencyInputWrapper,
            styles[resolvedSize],
            disabled && styles.disabled,
            required && styles.required,
            className
        ]
            .filter(Boolean)
            .join(' ')

        const inputContainerClasses = [
            styles.inputContainer,
            symbolPosition === 'before' && styles.hasPrefix,
            symbolPosition === 'after' && styles.hasSuffix,
            error && styles.inputError
        ]
            .filter(Boolean)
            .join(' ')

        return (
            <div className={containerClasses}>
                {label && <label className={styles.label}>{label}</label>}

                <div className={styles.formField}>
                    <div className={inputContainerClasses}>
                        {symbolPosition === 'before' && <span className={styles.symbolPrefix}>{config.symbol}</span>}

                        <input
                            ref={setRefs}
                            type='text'
                            inputMode='decimal'
                            autoComplete='off'
                            className={styles.input}
                            value={inputValue}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            disabled={disabled}
                            required={required}
                            name={name}
                            id={id}
                            autoFocus={autoFocus}
                            aria-invalid={!!error}
                            aria-describedby={error ? (id ?? name) + '-error' : undefined}
                        />

                        {symbolPosition === 'after' && <span className={styles.symbolSuffix}>{config.symbol}</span>}
                    </div>
                </div>

                {error && (
                    <div
                        className={styles.error}
                        id={(id ?? name) + '-error'}
                        role='alert'
                    >
                        {error}
                    </div>
                )}
            </div>
        )
    }
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
