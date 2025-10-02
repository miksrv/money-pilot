import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { removeItem, setItem } from '@/utils/localStorage'

interface AuthState {
    token: string | null
    isAuth: boolean
}

const initialState: AuthState = {
    token: null,
    isAuth: false
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<string>) => {
            state.token = action.payload
            state.isAuth = true

            setItem('auth', action.payload)
        },
        logout: (state) => {
            state.token = null
            state.isAuth = false

            removeItem('auth')
        }
    }
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
