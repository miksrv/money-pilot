import React, { PropsWithChildren, useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { store } from '@/store'
import { useAppSelector } from '@/store/hooks'

import { login, logout } from './store/authSlice'
import { useAppDispatch } from './store/hooks'
import { ApiError, useMeQuery } from './api'
import { Accounts, Categories, Dashboard, Login, Payees, Recurring, Register, Reports, Settings, Transactions } from './screens'

const savedTheme = localStorage.getItem('theme') ?? 'light'
const resolvedTheme =
    savedTheme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
        : savedTheme
document.documentElement.setAttribute('data-theme', resolvedTheme)

const App: React.FC = () => (
    <Provider store={store}>
        <BrowserRouter>
            <Routes>
                <Route
                    path='/'
                    element={
                        <AuthWrapper>
                            <Dashboard />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/transactions'
                    element={
                        <AuthWrapper>
                            <Transactions />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/categories'
                    element={
                        <AuthWrapper>
                            <Categories />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/accounts'
                    element={
                        <AuthWrapper>
                            <Accounts />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/recurring'
                    element={
                        <AuthWrapper>
                            <Recurring />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/payees'
                    element={
                        <AuthWrapper>
                            <Payees />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/reports'
                    element={
                        <AuthWrapper>
                            <Reports />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/settings'
                    element={
                        <AuthWrapper>
                            <Settings />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/login'
                    element={
                        <AuthWrapper>
                            <Login />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/register'
                    element={
                        <AuthWrapper>
                            <Register />
                        </AuthWrapper>
                    }
                />
            </Routes>
        </BrowserRouter>
    </Provider>
)

const AuthWrapper: React.FC<PropsWithChildren> = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const authSlice = useAppSelector((state) => state.auth)

    const authMeQuery = useMeQuery(undefined, { skip: !authSlice.token || authSlice.isAuth })

    useEffect(() => {
        if (authMeQuery?.error && (authMeQuery?.error as ApiError)?.status === 401 && authSlice.token) {
            dispatch(logout())

            return
        }

        if (authMeQuery?.data?.token) {
            dispatch(login(authMeQuery.data.token))

            if (location.pathname === '/login' || location.pathname === '/register') {
                void navigate('/')
            }

            return
        }
    }, [authMeQuery?.data, authMeQuery?.error])

    useEffect(() => {
        if (
            !authSlice.isAuth &&
            !authSlice.token &&
            location.pathname !== '/login' &&
            location.pathname !== '/register'
        ) {
            void navigate('/login')
        }
    }, [])

    return children
}

export default App
