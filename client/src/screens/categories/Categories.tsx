import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'
import { AppLayout } from '@/components'

import { CategoryForm } from './CategoryForm'

export const Categories: React.FC = () => {
    const { t } = useTranslation()

    const [openForm, setOpenForm] = useState(false)

    const { data: categories } = useListCategoriesQuery()

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    onClick={() => setOpenForm(true)}
                    label={t('categories.add')}
                />
            }
        >
            <h2>{t('categories.title')}</h2>

            {categories?.map((category) => (
                <div
                    key={category.id}
                    style={{
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: 'var(--surface)'
                    }}
                >
                    <h3>{category.name}</h3>
                    <p>
                        {t('categories.type')}: {t(`categories.types.${category.type}`)}
                    </p>
                    {category.icon && (
                        <p>
                            {t('categories.icon')}: {category.icon}
                        </p>
                    )}
                    {category.parent_id && (
                        <p>
                            {t('categories.parent')}: {category.parent_id}
                        </p>
                    )}
                </div>
            ))}

            <CategoryForm
                open={openForm}
                onCloseDialog={() => setOpenForm(false)}
            />
        </AppLayout>
    )
}
