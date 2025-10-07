import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Input } from 'simple-react-ui-kit'

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    value?: string
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, value }) => {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [selectedEmoji, setSelectedEmoji] = useState(value || '')
    const [search, setSearch] = useState('')
    const [emojis, setEmojis] = useState<string[]>([])
    const pickerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Dynamically generate a comprehensive list of emojis using Unicode ranges
        const emojiList: string[] = []
        // Common emoji ranges: Basic Emoticons, Symbols, Objects, etc.
        const ranges = [
            [0x1f600, 0x1f64f], // Emoticons
            [0x1f300, 0x1f5ff], // Symbols & Pictographs
            [0x1f680, 0x1f6ff], // Transport & Map Symbols
            [0x1f900, 0x1f9ff], // Supplemental Symbols
            [0x1f000, 0x1f02f], // Mahjong, Domino, etc.
            [0x1f0a0, 0x1f0ff], // Playing Cards
            [0x1f200, 0x1f2ff] // Enclosed Ideographic Supplement
        ]

        for (const [start, end] of ranges) {
            for (let codePoint = start; codePoint <= end; codePoint++) {
                const emoji = String.fromCodePoint(codePoint)
                // Filter out invalid or non-displayable code points
                if (emoji.match(/\p{Emoji}/u)) {
                    emojiList.push(emoji)
                }
            }
        }
        setEmojis(emojiList)
    }, [])

    const filteredEmojis = emojis.filter((emoji) => emoji.match(new RegExp(search, 'i')))

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(emoji)
        onSelect(emoji)
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
                value={selectedEmoji || search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('emojiPicker.placeholder')}
                onFocus={() => setIsOpen(true)}
                readOnly={!!selectedEmoji}
                className='w-full'
            />
            {isOpen && (
                <div className='absolute z-10 mt-2 w-64 max-h-48 overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-md shadow-lg'>
                    <div className='grid grid-cols-6 gap-2 p-2'>
                        {filteredEmojis.map((emoji, index) => (
                            <button
                                key={index}
                                type='button'
                                className='text-2xl hover:bg-[var(--primary-light)] rounded p-1'
                                onClick={() => handleEmojiSelect(emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                    {filteredEmojis.length === 0 && (
                        <p className='p-2 text-[var(--text-secondary)]'>{t('emojiPicker.noResults')}</p>
                    )}
                </div>
            )}
            {selectedEmoji && (
                <Button
                    mode='secondary'
                    icon='X'
                    onClick={() => {
                        setSelectedEmoji('')
                        onSelect('')
                        setSearch('')
                    }}
                    style={{ position: 'absolute', right: '0.5rem', top: '50%', transform: 'translateY(-50%)' }}
                />
            )}
        </div>
    )
}
