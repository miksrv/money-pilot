import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Input, Message } from 'simple-react-ui-kit'

import { useListPayeesQuery } from '@/api'
import { AppLayout, PayeesTable } from '@/components'
import { useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

export const Payees: React.FC = () => {
    const { t } = useTranslation()

    useEffect(() => {
        document.title = `${t('page.payees', 'Payees')} — Money Pilot`
    }, [t])

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300)
        return () => clearTimeout(timer)
    }, [search])

    const { data: payees, isLoading } = useListPayeesQuery(debouncedSearch ? { search: debouncedSearch } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    return (
        <AppLayout>
            <div className={styles.header}>
                <div className={styles.searchInput}>
                    <Input
                        id='payee-search'
                        type='text'
                        size='medium'
                        placeholder={t('payees.searchPayees', 'Search payees...')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {!isLoading && (!payees || payees.length === 0) && (
                <div className={styles.emptyState}>
                    <Message type='info'>{t('payees.noPayees', 'No payees found')}</Message>
                </div>
            )}

            {payees && payees.length > 0 && (
                <PayeesTable
                    payees={payees}
                    isLoading={isLoading}
                />
            )}
        </AppLayout>
    )
}
