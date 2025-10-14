import React, { useEffect, useRef, useState } from 'react'
import { Button, Popout, PopoutHandleProps } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

interface EmojiPickerProps {
    onSelect: (emoji: string) => void
    value?: string
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, value }) => {
    const [selectedEmoji, setSelectedEmoji] = useState(value || '💵')
    const [emojis, setEmojis] = useState<string[]>([])

    const popoutRef = useRef<PopoutHandleProps>(null)

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

    const handleEmojiSelect = (emoji: string) => {
        setSelectedEmoji(emoji)
        onSelect(emoji)
        popoutRef.current?.close()
    }

    return (
        <Popout
            ref={popoutRef}
            position={'left'}
            trigger={<Button mode='secondary'>{selectedEmoji}</Button>}
        >
            <div className={styles.emojiList}>
                {emojis.map((emoji, index) => (
                    <Button
                        key={index}
                        mode={'outline'}
                        onClick={() => handleEmojiSelect(emoji)}
                    >
                        {emoji}
                    </Button>
                ))}
            </div>
        </Popout>
    )
}
