import React, { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { useListCategoriesQuery, useUpdateTransactionMutation } from '@/api'
import { useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

interface CategoryPickerProps {
    transactionId: string
    currentCategoryId?: string
    onClose: () => void
}

export const CategoryPicker: React.FC<CategoryPickerProps> = ({ transactionId, currentCategoryId, onClose }) => {
    const { t } = useTranslation()
    const containerRef = useRef<HTMLDivElement>(null)
    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: categories } = useListCategoriesQuery(undefined, { skip: !isAuth })
    const [updateTransaction] = useUpdateTransactionMutation()

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose()
            }
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
            }
        }
        document.addEventListener('mousedown', handleMouseDown)
        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('mousedown', handleMouseDown)
            document.removeEventListener('keydown', handleKeyDown)
        }
    }, [onClose])

    const handleSelect = async (categoryId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        try {
            await updateTransaction({ id: transactionId, category_id: categoryId }).unwrap()
        } catch {
            console.error('Failed to update category')
        }
        onClose()
    }

    return (
        <div
            ref={containerRef}
            className={styles.categoryPicker}
            onClick={(e) => e.stopPropagation()}
        >
            {(categories ?? []).map((cat) => (
                <button
                    key={cat.id}
                    type='button'
                    className={[
                        styles.categoryPickerItem,
                        cat.id === currentCategoryId ? styles.categoryPickerItemActive : ''
                    ].join(' ')}
                    onClick={(e) => void handleSelect(cat.id ?? '', e)}
                >
                    <span className={styles.categoryPickerIcon}>{cat.icon}</span>
                    <span>{cat.name}</span>
                </button>
            ))}
            {(!categories || categories.length === 0) && (
                <span className={styles.categoryPickerEmpty}>{t('transactions.noCategory', 'No category')}</span>
            )}
        </div>
    )
}
