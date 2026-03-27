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
    /** Input size variant */
    size?: 'small' | 'medium' | 'large'
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
            onFocus
        },
        ref
    ) => {
        const config = getCurrencyConfig(currency)
        const displayLocale = locale || config.locale
        const inputRef = useRef<HTMLInputElement>(null)

        // Combine refs
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

        // Format value for display when not focused
        const formatForDisplay = useCallback(
            (num: number | null | undefined): string => {
                if (num == null || isNaN(num)) {
                    return ''
                }
                return formatNumber(num, currency, displayLocale)
            },
            [currency, displayLocale]
        )

        // Handle input change
        const handleChange = useCallback(
            (e: React.ChangeEvent<HTMLInputElement>) => {
                const rawValue = e.target.value

                // Allow only digits, decimal separators, minus sign, and spaces
                const allowedChars = allowNegative ? /[^0-9.,\-\s]/g : /[^0-9.,\s]/g
                const sanitized = rawValue.replace(allowedChars, '')

                setInputValue(sanitized)

                // Parse and notify parent
                const parsed = parseInputValue(sanitized)

                if (parsed != null) {
                    // Apply min/max constraints
                    let constrained = parsed
                    if (min !== undefined && parsed < min) {
                        constrained = min
                    }
                    if (max !== undefined && parsed > max) {
                        constrained = max
                    }

                    if (constrained !== parsed) {
                        // Value was constrained, update display
                        setInputValue(formatForDisplay(constrained))
                    }

                    onValueChange?.(constrained)
                } else {
                    onValueChange?.(null)
                }
            },
            [allowNegative, min, max, onValueChange, formatForDisplay]
        )

        // Handle focus
        const handleFocus = useCallback(
            (e: React.FocusEvent<HTMLInputElement>) => {
                setIsFocused(true)

                // Select all text on focus for easier editing
                setTimeout(() => {
                    inputRef.current?.select()
                }, 0)

                onFocus?.(e)
            },
            [onFocus]
        )

        // Handle blur - format the number nicely
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

        // Handle keyboard shortcuts and validation
        const handleKeyDown = useCallback(
            (e: React.KeyboardEvent<HTMLInputElement>) => {
                // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
                if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) {
                    return
                }

                // Allow: navigation keys
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
                    // Increment/decrement with arrow keys
                    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                        e.preventDefault()
                        const current = parseInputValue(inputValue) || 0
                        const step = e.shiftKey ? 10 : 1
                        const newValue = e.key === 'ArrowUp' ? current + step : current - step

                        // Apply constraints
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

                // Allow: digits
                if (e.key >= '0' && e.key <= '9') {
                    return
                }

                // Allow: decimal separator (comma or dot)
                if (e.key === ',' || e.key === '.') {
                    // Only allow one decimal separator
                    if (inputValue.includes(',') || inputValue.includes('.')) {
                        e.preventDefault()
                    }
                    return
                }

                // Allow: minus sign at start (if negative allowed)
                if (e.key === '-' && allowNegative) {
                    const input = e.target as HTMLInputElement
                    if (input.selectionStart === 0 && !inputValue.includes('-')) {
                        return
                    }
                }

                // Block everything else
                e.preventDefault()
            },
            [inputValue, allowNegative, min, max, onValueChange, formatForDisplay]
        )

        // Sync with external value changes
        useEffect(() => {
            if (!isFocused) {
                const newDisplayValue = formatForDisplay(value)
                if (newDisplayValue !== inputValue) {
                    setInputValue(newDisplayValue)
                }
            }
        }, [value, isFocused, formatForDisplay])

        // Determine symbol position
        const symbolPosition = showSymbol ? config.symbolPosition : null

        const containerClasses = [
            styles.currencyInputWrapper,
            styles[size],
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
                            aria-describedby={error ? `${id || name}-error` : undefined}
                        />

                        {symbolPosition === 'after' && <span className={styles.symbolSuffix}>{config.symbol}</span>}
                    </div>
                </div>

                {error && (
                    <div
                        className={styles.error}
                        id={`${id || name}-error`}
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
