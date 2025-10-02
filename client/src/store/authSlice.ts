import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { LocalStorage } from '@/utils/localStorage'

const AUTH_TOKEN = 'auth'

export const getStorageToken = (): string | null => LocalStorage.getItem(AUTH_TOKEN)

interface AuthState {
    token: string | null
    isAuth: boolean
}

const initialState: AuthState = {
    token: getStorageToken(),
    isAuth: false
}

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        login: (state, action: PayloadAction<string>) => {
            state.token = action.payload
            state.isAuth = true

            LocalStorage.setItem(AUTH_TOKEN, action.payload)
        },
        logout: (state) => {
            state.token = null
            state.isAuth = false

            LocalStorage.removeItem(AUTH_TOKEN)
        }
    }
})

export const { login, logout } = authSlice.actions
export default authSlice.reducer
