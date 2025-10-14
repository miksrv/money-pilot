import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from 'simple-react-ui-kit'

export const colors = {
    brown: ['#795548', '#8d6e63'], // Brown
    navy: ['#283593', '#3f51b5'], // Navy
    violet: ['#8c1fc9', '#a23de3'], // Violet
    purple: ['#7d2ae8', '#9146ff'], // Purple
    magenta: ['#c2185b', '#db3c7f'], // Magenta
    pink: ['#e91e63', '#ff5b85'], // Pink
    red: ['#e53935', '#f25755'], // Red
    orange: ['#ff5722', '#ff7043'], // Orange
    yellow: ['#ffeb3b', '#fff176'], // Yellow
    lime: ['#cddc39', '#d4e157'], // Lime
    olive: ['#8c9e35', '#a3b236'], // Olive
    green: ['#4caf50', '#66bb6a'], // Green
    teal: ['#009688', '#26a69a'], // Teal
    blue: ['#2c7eec', '#468de8'], // Blue
    lightblue: ['#2196f3', '#42a5f5'], // Light Blue
    cyan: ['#00bcd4', '#4dd0e1'], // Cyan
    air: ['#8dbdef', '#9bc4f5'], // Air
    grey: ['#607d8b', '#78909c'] // Grey
}

export type ColorName = keyof typeof colors

export const getColorHex = (colorName: ColorName): string => {
    return colors[colorName]?.[1] || '#000000' // Return primary color or fallback to black
}

interface ColorPickerProps {
    onSelect: (color: ColorName) => void
    value?: ColorName | string
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ onSelect, value }) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedColor, setSelectedColor] = useState<ColorName | string>(value || '')
    const [search, setSearch] = useState('')
    const pickerRef = useRef<HTMLDivElement>(null)

    const filteredColors = Object.keys(colors).filter((color) =>
        color.toLowerCase().includes(search.toLowerCase())
    ) as ColorName[]

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleColorSelect = (color: ColorName) => {
        setSelectedColor(color)
        onSelect(color)
        setIsOpen(false)
    }

    return (
        <div
            className='relative'
            ref={pickerRef}
        >
            <Input
                type='text'
                size='medium'
                value={selectedColor ? t(selectedColor) : search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('colorPicker.placeholder')}
                onFocus={() => setIsOpen(true)}
                readOnly={!!selectedColor}
                className='w-full'
                style={selectedColor ? { backgroundColor: getColorHex(selectedColor as ColorName), color: '#fff' } : {}}
            />
            {isOpen && (
                <div className='absolute z-10 mt-2 w-64 max-h-48 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg'>
                    <div className='grid grid-cols-4 gap-2 p-2'>
                        {filteredColors.map((color) => (
                            <button
                                key={color}
                                type='button'
                                className='w-12 h-12 rounded hover:opacity-80'
                                style={{ backgroundColor: colors[color][0] }}
                                onClick={() => handleColorSelect(color)}
                                title={t(`colors.${color}`)}
                            />
                        ))}
                    </div>
                    {filteredColors.length === 0 && (
                        <p className='p-2 text-[var(--text-secondary)]'>{t('colorPicker.noResults')}</p>
                    )}
                </div>
            )}
            {selectedColor && (
                <Button
                    mode='secondary'
                    onClick={() => {
                        setSelectedColor('')
                        onSelect('' as ColorName)
                        setSearch('')
                    }}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
                />
            )}
        </div>
    )
}
