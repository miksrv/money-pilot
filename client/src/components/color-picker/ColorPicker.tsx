import React, { useEffect, useRef, useState } from 'react'
import { Button, Popout, PopoutHandleProps } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

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
    const [selectedColor, setSelectedColor] = useState<ColorName | string>(value || 'grey')

    const popoutRef = useRef<PopoutHandleProps>(null)

    const handleColorSelect = (color: ColorName) => {
        setSelectedColor(color)
        onSelect(color)
        popoutRef.current?.close()
    }

    useEffect(() => {
        if (value && value !== selectedColor) {
            setSelectedColor(value)
        }
    }, [value])

    return (
        <Popout
            ref={popoutRef}
            position={'left'}
            trigger={
                <Button
                    mode={'secondary'}
                    className={styles.triggerButton}
                    style={{ backgroundColor: colors[selectedColor as ColorName][0] }}
                />
            }
        >
            <div className={styles.colorList}>
                {(Object.keys(colors) as ColorName[]).map((color) => (
                    <Button
                        key={color}
                        mode={'outline'}
                        style={{ backgroundColor: colors[color][0] }}
                        onClick={() => handleColorSelect(color)}
                    />
                ))}
            </div>
        </Popout>
    )
}
