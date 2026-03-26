import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'

import { LocalStorage } from '@/utils/localStorage'

const AUTH_TOKEN = 'auth'
const ACTIVE_GROUP_KEY = 'activeGroupId'

export const getStorageToken = (): string | null => LocalStorage.getItem(AUTH_TOKEN)

export interface AuthState {
    token: string | null
    isAuth: boolean
    activeGroupId: string | null
}

const initialState: AuthState = {
    token: getStorageToken(),
    isAuth: false,
    activeGroupId: LocalStorage.getItem<string>(ACTIVE_GROUP_KEY)
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
            state.activeGroupId = null

            LocalStorage.removeItem(AUTH_TOKEN)
            LocalStorage.removeItem(ACTIVE_GROUP_KEY)
        },
        setActiveGroup: (state, action: PayloadAction<string | null>) => {
            state.activeGroupId = action.payload

            if (action.payload) {
                LocalStorage.setItem(ACTIVE_GROUP_KEY, action.payload)
            } else {
                LocalStorage.removeItem(ACTIVE_GROUP_KEY)
            }
        }
    }
})

export const { login, logout, setActiveGroup } = authSlice.actions
export default authSlice.reducer
