import React, { PropsWithChildren, useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { store } from '@/store'
import { useAppSelector } from '@/store/hooks'

import { login, logout } from './store/authSlice'
import { useAppDispatch } from './store/hooks'
import { useMeQuery } from './api'
import { Categories, Dashboard, Login, Recurring, Register, Settings, Transactions } from './screens'

const App: React.FC = () => (
    <Provider store={store}>
        <BrowserRouter>
            <Routes>
                <Route
                    path='/'
                    element={
                        <AuthWrapper>
                            <Navigate to='/dashboard' />
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
                    path='/dashboard'
                    element={
                        <AuthWrapper>
                            <Dashboard />
                        </AuthWrapper>
                    }
                />

                <Route
                    path='/reccuring'
                    element={
                        <AuthWrapper>
                            <Recurring />
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
                    path='/transactions'
                    element={
                        <AuthWrapper>
                            <Transactions />
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

    const authMeQuery = useMeQuery({}, { skip: !authSlice.token || authSlice.isAuth })

    useEffect(() => {
        if (authMeQuery?.error && authMeQuery?.error?.status === 401 && authSlice.token) {
            dispatch(logout())

            return
        }

        if (authMeQuery?.data?.token) {
            dispatch(login(authMeQuery.data.token))

            if (location.pathname === '/login' || location.pathname === '/register') {
                void navigate('/dashboard')
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
