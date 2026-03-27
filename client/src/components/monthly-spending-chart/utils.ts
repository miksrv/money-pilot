export const COLOR_GREEN = '#4CAF50'
export const COLOR_YELLOW = '#FF9800'
export const COLOR_RED = '#F44336'

export const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    return [r, g, b]
}

export const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number) =>
        Math.round(Math.max(0, Math.min(255, n)))
            .toString(16)
            .padStart(2, '0')

    return '#' + toHex(r) + toHex(g) + toHex(b)
}

export const interpolateColor = (color1: string, color2: string, factor: number): string => {
    const [r1, g1, b1] = hexToRgb(color1)
    const [r2, g2, b2] = hexToRgb(color2)

    const r = r1 + (r2 - r1) * factor
    const g = g1 + (g2 - g1) * factor
    const b = b1 + (b2 - b1) * factor

    return rgbToHex(r, g, b)
}

export const getSegmentColor = (current: number | null, previous: number | null): string => {
    if (current == null || previous == null || previous === 0) {
        return COLOR_GREEN
    }

    const ratio = current / previous

    // ratio <= 0.5: красный (тратим намного меньше — отлично!)
    // ratio 0.5 - 1.0: плавный переход красный → зелёный
    // ratio 1.0 - 1.2: плавный переход зелёный → жёлтый
    // ratio 1.2 - 1.5: плавный переход жёлтый → красный
    // ratio >= 1.5: красный (тратим намного больше — плохо)

    if (ratio <= 0.5) {
        return COLOR_RED
    }

    if (ratio <= 1.0) {
        const factor = (ratio - 0.5) / 0.5

        return interpolateColor(COLOR_RED, COLOR_GREEN, factor)
    }

    if (ratio <= 1.2) {
        const factor = (ratio - 1.0) / 0.2

        return interpolateColor(COLOR_GREEN, COLOR_YELLOW, factor)
    }

    if (ratio <= 1.5) {
        const factor = (ratio - 1.2) / 0.3

        return interpolateColor(COLOR_YELLOW, COLOR_RED, factor)
    }

    return COLOR_RED
}

export const getStatusColor = (current: number, previous: number): string => getSegmentColor(current, previous)
