export function getStatusColor(current: number, previous: number): string {
    if (previous === 0) {
        return '#4CAF50'
    }

    const ratio = current / previous

    if (ratio <= 1.0) {
        return '#4CAF50'
    }

    if (ratio <= 1.2) {
        return '#FF9800'
    }

    return '#F44336'
}

export function colorWithAlpha(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)

    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')'
}
