import React, { PropsWithChildren, useEffect } from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { store } from '@/store'
import { useAppSelector } from '@/store/hooks'

import { useMeMutation } from './api'
import { Categories, Dashboard, Login, Recurring, Register, Settings, Transactions } from './screens'

const App: React.FC = () => {
    return (
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
}

// const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//     const isAuthenticated = useAppSelector((state) => !!state.auth.isAuth)
//     return isAuthenticated ? <>{children}</> : <Navigate to='/login' />
// }

const AuthWrapper: React.FC<PropsWithChildren> = ({ children }) => {
    const authSlice = useAppSelector((state) => state.auth)

    const [meMutation] = useMeMutation()

    useEffect(() => {
        if (authSlice?.token) {
            void meMutation()
        }
    }, [])

    return children
}

export default App
