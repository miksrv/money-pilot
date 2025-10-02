export function setItem(key: string, value: string): void {
    window.localStorage.setItem(key, value)
}

export function getItem<T>(key: string): T | null {
    const item = window.localStorage.getItem(key)

    if (item == null) {
        return null
    }

    try {
        return JSON.parse(item) as T
    } catch {
        return null
    }
}

export function removeItem(key: string): void {
    window.localStorage.removeItem(key)
}

export function clear(): void {
    window.localStorage.clear()
}
