import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Message, Skeleton } from 'simple-react-ui-kit'

import { useListRecurringQuery } from '@/api'
import { AppLayout, RecurringFormDialog, RecurringTable } from '@/components'
import { useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

export const Recurring: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.recurring', 'Recurring')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const [openForm, setOpenForm] = useState(false)

    const { data: items, isLoading } = useListRecurringQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

    return (
        <AppLayout
            actions={
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    label={t('recurring.addRecurring', 'Add Recurring')}
                    onClick={() => setOpenForm(true)}
                />
            }
        >
            {isLoading && <Skeleton style={{ height: '200px', width: '100%' }} />}

            {!isLoading && (!items || items.length === 0) && (
                <div className={styles.emptyState}>
                    <Message type='info'>{t('recurring.noRecurring', 'No recurring transactions yet')}</Message>
                    <Button
                        mode='secondary'
                        icon='PlusCircle'
                        label={t('recurring.addFirst', 'Add your first recurring transaction')}
                        onClick={() => setOpenForm(true)}
                    />
                </div>
            )}

            {!isLoading && items && items.length > 0 && (
                <RecurringTable
                    items={items}
                    isLoading={isLoading}
                />
            )}

            {/* Add new recurring dialog */}
            <RecurringFormDialog
                open={openForm}
                onCloseDialog={() => setOpenForm(false)}
            />
        </AppLayout>
    )
}
