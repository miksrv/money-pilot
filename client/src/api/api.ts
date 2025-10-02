import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { RootState } from '@/store'

import { ApiType } from './index'

export const HOST_API = 'http://localhost:8080/'

export interface ApiError {
    messages: {
        error?: string
    }
}

export const api = createApi({
    reducerPath: 'api',
    baseQuery: fetchBaseQuery({
        baseUrl: HOST_API,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token

            if (token) {
                headers.set('Authorization', `Bearer ${String(token)}`)
            }

            return headers
        }
    }),
    endpoints: (builder) => ({
        /* Registration */
        registration: builder.mutation<ApiType.Registration.Response, ApiType.Registration.Request>({
            transformErrorResponse: (response) => response.data as ApiError,
            query: (body) => ({
                body,
                method: 'POST',
                url: 'register'
            })
        }),
        /* Login */
        login: builder.mutation<ApiType.Registration.Response, ApiType.Registration.Request>({
            transformErrorResponse: (response) => response.data as ApiError,
            query: (body) => ({
                body,
                method: 'POST',
                url: 'auth/login'
            })
        })
    })
})

export const { useRegistrationMutation, useLoginMutation } = api
