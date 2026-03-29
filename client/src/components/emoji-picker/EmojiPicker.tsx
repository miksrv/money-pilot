import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input, Popout, PopoutHandleProps } from 'simple-react-ui-kit'

import { CATEGORY_ICONS, CATEGORY_LABELS, EMOJI_CATEGORIES, EMOJI_DATA, EmojiCategory } from './constants'
import { getRecentEmojis, saveRecentEmoji } from './utils'

import styles from './styles.module.sass'

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    value?: string
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, value }) => {
    const { t, i18n } = useTranslation()
    const lang = i18n.language?.startsWith('ru') ? 'ru' : 'en'

    const [searchQuery, setSearchQuery] = useState('')
    const [activeCategory, setActiveCategory] = useState<EmojiCategory>('objects')
    const [recentEmojis, setRecentEmojis] = useState<string[]>([])

    const popoutRef = useRef<PopoutHandleProps>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLDivElement>(null)

    // Use value from props directly, fallback to default
    const selectedEmoji = value || '💵'

    useEffect(() => {
        setRecentEmojis(getRecentEmojis())
    }, [])

    const filteredEmojis = useMemo(() => {
        if (!searchQuery.trim()) {
            if (activeCategory === 'recent') {
                return recentEmojis.map((emoji) => ({
                    emoji,
                    keywords: { en: [], ru: [] },
                    category: 'recent' as EmojiCategory
                }))
            }
            return EMOJI_DATA.filter((e) => e.category === activeCategory)
        }

        const query = searchQuery.toLowerCase().trim()
        return EMOJI_DATA.filter((e) => {
            const enMatch = e.keywords.en.some((k) => k.toLowerCase().includes(query))
            const ruMatch = e.keywords.ru.some((k) => k.toLowerCase().includes(query))
            const emojiMatch = e.emoji.includes(query)
            return enMatch || ruMatch || emojiMatch
        })
    }, [searchQuery, activeCategory, recentEmojis])

    const handleEmojiSelect = useCallback(
        (emoji: string) => {
            onSelect(emoji)
            saveRecentEmoji(emoji)
            setRecentEmojis(getRecentEmojis())
            popoutRef.current?.close()
            setSearchQuery('')
        },
        [onSelect]
    )

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && filteredEmojis.length > 0) {
                handleEmojiSelect(filteredEmojis[0].emoji)
            }
        },
        [filteredEmojis, handleEmojiSelect]
    )

    const handlePopoutOpenChange = useCallback((isOpen: boolean) => {
        if (isOpen) {
            setSearchQuery('')
            setRecentEmojis(getRecentEmojis())
            // Focus search input when popout opens
            setTimeout(() => {
                searchInputRef.current?.focus()
            }, 100)
        }
    }, [])

    return (
        <Popout
            ref={popoutRef}
            position={'left'}
            onOpenChange={handlePopoutOpenChange}
            trigger={
                <Button
                    className={styles.emojiTrigger}
                    mode={'secondary'}
                >
                    {selectedEmoji}
                </Button>
            }
        >
            <div className={styles.emojiPickerContainer}>
                {/* Search */}
                <div className={styles.searchContainer}>
                    <Input
                        type='text'
                        placeholder={t('emoji.search', 'Search emoji...')}
                        // value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={styles.searchInput}
                    />
                </div>

                {/* Category tabs */}
                {!searchQuery && (
                    <div className={styles.categoryTabs}>
                        {EMOJI_CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                type='button'
                                className={[
                                    styles.categoryTab,
                                    activeCategory === cat ? styles.categoryTabActive : ''
                                ].join(' ')}
                                onClick={() => {
                                    setActiveCategory(cat)
                                    listRef.current?.scrollTo({ top: 0 })
                                }}
                                title={CATEGORY_LABELS[cat][lang]}
                            >
                                {CATEGORY_ICONS[cat]}
                            </button>
                        ))}
                    </div>
                )}

                {/* Category label */}
                <div className={styles.categoryLabel}>
                    {searchQuery
                        ? t('emoji.searchResults', 'Search Results') + ` (${filteredEmojis.length})`
                        : CATEGORY_LABELS[activeCategory][lang]}
                </div>

                {/* Emoji grid */}
                <div
                    ref={listRef}
                    className={styles.emojiList}
                >
                    {filteredEmojis.length === 0 ? (
                        <div className={styles.emptyState}>
                            {activeCategory === 'recent'
                                ? t('emoji.noRecent', 'No recent emojis')
                                : t('emoji.noResults', 'No emojis found')}
                        </div>
                    ) : (
                        filteredEmojis.map((item, index) => (
                            <button
                                key={`${item.emoji}-${index}`}
                                type='button'
                                className={styles.emojiButton}
                                onClick={() => handleEmojiSelect(item.emoji)}
                                title={item.keywords[lang]?.join(', ') || item.emoji}
                            >
                                {item.emoji}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </Popout>
    )
}
