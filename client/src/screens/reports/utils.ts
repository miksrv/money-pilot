type Preset = 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'thisYear' | 'custom'

export function getPresetRange(preset: Preset): { date_from: string; date_to: string } {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (preset === 'thisMonth') {
        const from = new Date(now.getFullYear(), now.getMonth(), 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'lastMonth') {
        const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const to = new Date(now.getFullYear(), now.getMonth(), 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'last3Months') {
        const from = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'last6Months') {
        const from = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        return { date_from: fmt(from), date_to: fmt(to) }
    }
    if (preset === 'thisYear') {
        return { date_from: `${now.getFullYear()}-01-01`, date_to: `${now.getFullYear()}-12-31` }
    }
    return { date_from: fmt(now), date_to: fmt(now) }
}

export function downloadCsv(filename: string, headers: string[], rows: string[][]): void {
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
