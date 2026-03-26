import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Popout, PopoutHandleProps } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

interface CategoryPickerProps {
    currentCategoryId?: string | null
    onSelect: (categoryId: string) => void
    trigger: React.ReactNode
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ currentCategoryId, onSelect, trigger }) => {
    const { t } = useTranslation()
    const popoutRef = useRef<PopoutHandleProps>(null)
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: categories } = useListCategoriesQuery(undefined, { skip: !isAuth })

    const handleSelect = (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onSelect(categoryId)
        popoutRef.current?.close()
    }

    // Filter out parent categories (they are not selectable) and sort alphabetically
    const selectableCategories = (categories ?? [])
        .filter((cat) => !cat.is_parent)
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))

    return (
        <Popout
            ref={popoutRef}
            trigger={trigger}
        >
            <div
                className={styles.categoryPicker}
                onClick={(e) => e.stopPropagation()}
            >
                {selectableCategories.map((cat) => (
                    <button
                        key={cat.id}
                        type='button'
                        className={[
                            styles.categoryPickerItem,
                            cat.id === currentCategoryId ? styles.categoryPickerItemActive : ''
                        ].join(' ')}
                        onClick={(e) => handleSelect(cat.id ?? '', e)}
                    >
                        <span className={styles.categoryPickerIcon}>{cat.icon}</span>
                        <span>{cat.name}</span>
                    </button>
                ))}
                {selectableCategories.length === 0 && (
                    <span className={styles.categoryPickerEmpty}>{t('transactions.noCategory', 'No category')}</span>
                )}
            </div>
        </Popout>
    )
}
