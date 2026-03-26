const RECENT_EMOJIS_KEY = 'money-pilot-recent-emojis'
const MAX_RECENT = 16

export const getRecentEmojis = (): string[] => {
    try {
        const stored = localStorage.getItem(RECENT_EMOJIS_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

export const saveRecentEmoji = (emoji: string) => {
    try {
        const recent = getRecentEmojis().filter((e) => e !== emoji)
        recent.unshift(emoji)
        localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
    } catch {
        // ignore
    }
}
