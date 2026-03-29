import React, { PropsWithChildren, useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { ApiError, useMeQuery } from '@/api'
import {
    Accounts,
    Categories,
    Dashboard,
    JoinBudget,
    Login,
    Payees,
    Recurring,
    Register,
    Reports,
    Settings,
    Transactions
} from '@/screens'
import { store } from '@/store'
import { login, logout } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

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

                <Route
                    path='/join/:token'
                    element={<JoinBudget />}
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
                const params = new URLSearchParams(location.search)
                const redirect = params.get('redirect')
                void navigate(redirect ?? '/')
            }

            return
        }
    }, [authMeQuery?.data, authMeQuery?.error])

    useEffect(() => {
        if (
            !authSlice.isAuth &&
            !authSlice.token &&
            location.pathname !== '/login' &&
            location.pathname !== '/register' &&
            !location.pathname.startsWith('/join/')
        ) {
            void navigate('/login')
        }
    }, [authSlice.isAuth, authSlice.token])

    return children
}

export default App
