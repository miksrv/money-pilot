import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { InputProps } from 'simple-react-ui-kit'
import { Input } from 'simple-react-ui-kit'

interface CurrencyConfig {
    code: string
    symbol: string
    position: 'prefix' | 'suffix'
    decimalSeparator: string
    thousandSeparator: string
    allowNegative?: boolean
    decimalPlaces?: number
}

interface MoneyInputProps extends Omit<InputProps, 'value' | 'onChange'> {
    value: number
    onChange: (value: number) => void
    currency?: CurrencyConfig
    placeholder?: string
}

const defaultCurrency: CurrencyConfig = {
    code: 'USD',
    symbol: '$',
    position: 'prefix',
    decimalSeparator: '.',
    thousandSeparator: ',',
    allowNegative: true,
    decimalPlaces: 2
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
    value,
    onChange,
    currency = defaultCurrency,
    placeholder,
    ...props
}) => {
    const { t } = useTranslation()
    const [displayValue, setDisplayValue] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const formatValue = (val: number): string => {
        if (isNaN(val)) {
            return ''
        }
        const sign = val < 0 ? '-' : ''
        const absVal = Math.abs(val)
        const [integer, decimal] = absVal.toFixed(currency.decimalPlaces).split('.')
        const formattedInteger = integer.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandSeparator)
        return `${sign}${formattedInteger}${currency.decimalSeparator}${decimal}`
    }

    const parseValue = (str: string): number => {
        const clean = str
            .replace(new RegExp(`\\${currency.thousandSeparator}`, 'g'), '')
            .replace(currency.decimalSeparator, '.')
            .replace(/[^0-9.-]/g, '') // Remove invalid chars
        return parseFloat(clean) || 0
    }

    useEffect(() => {
        setDisplayValue(formatValue(value))
    }, [value, currency])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab']
        const isAllowed =
            allowedKeys.includes(e.key) ||
            (e.key >= '0' && e.key <= '9') ||
            (e.key === currency.decimalSeparator && !displayValue.includes(currency.decimalSeparator)) ||
            (currency.allowNegative &&
                e.key === '-' &&
                !displayValue.includes('-') &&
                inputRef.current?.selectionStart === 0)
        if (!isAllowed) {
            e.preventDefault()
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(currency.symbol, '').trim()
        // Limit decimals to specified places
        if (input.includes(currency.decimalSeparator)) {
            const [integer, decimal] = input.split(currency.decimalSeparator)
            input = `${integer}${currency.decimalSeparator}${decimal.slice(0, currency.decimalPlaces)}`
        }
        setDisplayValue(input)
        const parsed = parseValue(input)
        onChange(parsed)
    }

    const handleBlur = () => {
        const parsed = parseValue(displayValue)
        setDisplayValue(formatValue(parsed))
        onChange(parsed)
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pasted = e.clipboardData.getData('text')
        if (!/^-?\d*(\.\d+)?$/.test(pasted)) {
            e.preventDefault()
        }
    }

    const inputValue =
        currency.position === 'prefix' ? `${currency.symbol}${displayValue}` : `${displayValue}${currency.symbol}`

    return (
        <div className='relative'>
            <Input
                ref={inputRef}
                type='text'
                size='medium'
                value={inputValue}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onPaste={handlePaste}
                placeholder={placeholder || t('moneyInput.placeholder')}
                className='w-full'
                {...props}
            />
        </div>
    )
}
