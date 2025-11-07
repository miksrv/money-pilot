import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { Input } from 'simple-react-ui-kit'

import { Currency } from './types'

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
    value?: number | string
    onValueChange?: (value: number | null) => void
    currency: Currency
    locale?: string
}

const getCurrencyFormat = (value: number, currency: Currency, locale: string) =>
    new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
    }).format(value)

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onValueChange, currency, locale = 'ru-RU', ...props }, ref) => {
        const [inputValue, setInputValue] = useState<string>(
            value !== undefined && value != null ? getCurrencyFormat(Number(value), currency, locale) : ''
        )
        const inputRef = useRef<HTMLInputElement>(null)

        useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Remove all characters except digits, dot, comma, and space
            const sanitized = e.target.value.replace(/[^0-9.,\s]/g, '')
            setInputValue(sanitized)
            const raw = sanitized.replace(/[^\d.,-]/g, '').replace(',', '.')
            const num = parseFloat(raw)
            if (onValueChange) {
                onValueChange(isNaN(num) ? null : num)
            }
        }

        const handleBlur = () => {
            const num = parseFloat(inputValue.replace(/[^\d.,-]/g, '').replace(',', '.'))
            if (!isNaN(num)) {
                setInputValue(getCurrencyFormat(num, currency, locale))
            } else {
                setInputValue('')
            }
        }

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            // Allow: digits, comma, dot, space, navigation, backspace, delete
            if (
                !(
                    (e.key >= '0' && e.key <= '9') ||
                    e.key === ',' ||
                    e.key === '.' ||
                    e.key === ' ' ||
                    e.key === 'Backspace' ||
                    e.key === 'Delete' ||
                    e.key === 'ArrowLeft' ||
                    e.key === 'ArrowRight' ||
                    e.key === 'Tab'
                )
            ) {
                e.preventDefault()
            }
        }

        return (
            <Input
                {...props}
                ref={inputRef}
                value={inputValue}
                onChange={handleChange}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                inputMode='decimal'
                autoComplete='off'
            />
        )
    }
)

CurrencyInput.displayName = 'CurrencyInput'

export default CurrencyInput
