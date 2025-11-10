import React, { forwardRef, useEffect, useState } from 'react'
import { Input } from 'simple-react-ui-kit'

import { Currency } from './types'

export interface CurrencyInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'size'> {
    value?: number | string
    onValueChange?: (value: number | null) => void
    currency: Currency
    locale?: string
}

const getCurrencyFormat = (value: number, currency: Currency, locale: string) => {
    if (isNaN(value)) {
        return ''
    }

    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 2
    }).format(value)
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
    ({ value, onValueChange, currency, locale = 'ru-RU', ...props }) => {
        const [inputValue, setInputValue] = useState<string>(
            value !== undefined && value != null ? getCurrencyFormat(Number(value), currency, locale) : ''
        )

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                return
            }

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

        useEffect(() => {
            if (value !== undefined && inputValue !== String(value)) {
                setInputValue(getCurrencyFormat(Number(value), currency, locale))
            }
        }, [value])

        return (
            <Input
                {...props}
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
