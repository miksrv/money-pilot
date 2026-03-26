import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Select } from 'simple-react-ui-kit'

import { useListGroupsQuery, useLogoutMutation } from '@/api'
import { logout, setActiveGroup } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

export interface AppBarProps {
    actions?: React.ReactNode
    onToggle?: () => void
}

export const AppBar: React.FC<AppBarProps> = ({ actions, onToggle }) => {
    const { t } = useTranslation()

    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const [logoutMutation, { isSuccess }] = useLogoutMutation()

    const { data: groups } = useListGroupsQuery(undefined, { skip: !isAuth })

    const handleLogout = async () => {
        await logoutMutation()
    }

    useEffect(() => {
        if (isSuccess) {
            dispatch(logout())
            void navigate('/login')
        }
    }, [isSuccess])

    const showSwitcher = (groups?.length ?? 0) > 0

    const switcherOptions = [
        { key: '', value: t('groups.myBudget', 'My Budget') },
        ...(groups?.map((g) => ({ key: g.id, value: g.name })) ?? [])
    ]

    return (
        <header className={styles.appBar}>
            <div className={styles.wrapper}>
                <div className={styles.left}>
                    <button
                        className={styles.hamburgerButton}
                        onClick={onToggle}
                        aria-label='Toggle sidebar'
                    >
                        <svg
                            viewBox='0 0 24 24'
                            xmlns='http://www.w3.org/2000/svg'
                        >
                            <path d='M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z' />
                        </svg>
                    </button>
                    {actions}
                </div>
                <div className={styles.right}>
                    {showSwitcher && (
                        <Select<string>
                            options={switcherOptions}
                            value={activeGroupId ?? ''}
                            onSelect={(items) => dispatch(setActiveGroup(items?.[0]?.key || null))}
                        />
                    )}
                    <Button onClick={handleLogout}>{t('components.app-bar.logout', 'Logout')}</Button>
                </div>
            </div>
        </header>
    )
}
