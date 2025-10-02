const setItem = (key: string, value: string): void => localStorage.setItem(key, value)

const getItem = <T>(key: string): T | null => {
    const item = localStorage.getItem(key)

    if (item == null) {
        return null
    }

    try {
        return JSON.parse(item) as T
    } catch {
        return item as unknown as T
    }
}

const removeItem = (key: string): void => localStorage.removeItem(key)

const clear = (): void => localStorage.clear()

export const LocalStorage = {
    setItem,
    getItem,
    removeItem,
    clear
}
