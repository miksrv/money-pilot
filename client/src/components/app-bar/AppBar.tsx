import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from 'simple-react-ui-kit'

import { useLogoutMutation } from '@/api'
import { logout } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'

import styles from './styles.module.sass'

export interface AppBarProps {
    actions?: React.ReactNode
}

export const AppBar: React.FC<AppBarProps> = ({ actions }) => {
    const { t } = useTranslation()

    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const [logoutMutation, { isSuccess }] = useLogoutMutation()

    const handleLogout = async () => {
        await logoutMutation()
    }

    useEffect(() => {
        if (isSuccess) {
            dispatch(logout())
            void navigate('/login')
        }
    }, [isSuccess])

    return (
        <header className={styles.appBar}>
            <div className={styles.wrapper}>
                <div>{actions}</div>
                <Button onClick={handleLogout}>{'Logout'}</Button>
            </div>
        </header>
    )
}
