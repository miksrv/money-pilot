import React, { PropsWithChildren, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'simple-react-ui-kit'

import { useLogoutMutation } from '@/api'
import { logout } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'

export const AppLayout: React.FC<PropsWithChildren> = (props) => {
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
        <>
            <Button onClick={handleLogout}>{'Logout'}</Button>
            {props.children}
        </>
    )
}
