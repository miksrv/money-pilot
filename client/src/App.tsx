import * as React from 'react'
import { Provider } from 'react-redux'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { store } from '@/store'
import { useAppSelector } from '@/store/hooks'

import { Categories, Dashboard, Login, Recurring, Register, Settings, Transactions } from './screens'

const App: React.FC = () => {
    return (
        <Provider store={store}>
            <BrowserRouter>
                <Routes>
                    <Route
                        path='/'
                        element={
                            <ProtectedRoute>
                                <Navigate to='/dashboard' />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/categories'
                        element={
                            <ProtectedRoute>
                                <Categories />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/dashboard'
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/reccuring'
                        element={
                            <ProtectedRoute>
                                <Recurring />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/settings'
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/transactions'
                        element={
                            <ProtectedRoute>
                                <Transactions />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path='/login'
                        element={<Login />}
                    />

                    <Route
                        path='/register'
                        element={<Register />}
                    />
                </Routes>
            </BrowserRouter>
        </Provider>
    )
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const isAuthenticated = useAppSelector((state) => !!state.auth.isAuth)
    return isAuthenticated ? <>{children}</> : <Navigate to='/login' />
}

export default App
