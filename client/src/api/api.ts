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
    tagTypes: ['Category'],
    baseQuery: fetchBaseQuery({
        baseUrl: HOST_API,
        prepareHeaders: (headers, { getState }) => {
            const token = (getState() as RootState).auth.token

            if (token) {
                headers.set('Authorization', String(token))
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
        }),
        /* Logout */
        logout: builder.mutation<void, void>({
            transformErrorResponse: (response) => response.data as ApiError,
            query: () => ({
                method: 'GET',
                url: 'auth/logout'
            })
        }),
        /* Get me */
        me: builder.query<ApiType.Registration.Response, void>({
            transformErrorResponse: (response) => response.data as ApiError,
            query: () => 'auth/me'
        }),
        /* Add account */
        addAccount: builder.mutation<void, ApiType.Account.Request>({
            query: (body) => ({
                url: 'accounts',
                method: 'POST',
                body
            })
        }),
        /* List accounts */
        listAccount: builder.query<ApiType.Account.Response[], void>({
            query: () => 'accounts'
        }),
        /* List transactions */
        listTransactions: builder.query<ApiType.Transaction.Response[], void>({
            query: () => '/transactions'
        }),
        /* Add transaction */
        addTransaction: builder.mutation<void, ApiType.Transaction.Request>({
            query: (body) => ({
                url: 'transactions',
                method: 'POST',
                body
            })
        }),
        /* List Categories */
        listCategories: builder.query<ApiType.Category.Response[], void>({
            providesTags: () => [{ id: 'LIST', type: 'Category' }],
            query: () => '/categories'
        }),
        /* Add Category */
        addCategory: builder.mutation<void, ApiType.Category.Request>({
            invalidatesTags: [{ id: 'LIST', type: 'Category' }],
            query: (body) => ({
                url: 'categories',
                method: 'POST',
                body
            })
        })
    })
})

export const {
    useRegistrationMutation,
    useLoginMutation,
    useLogoutMutation,
    useMeQuery,
    useAddTransactionMutation,
    useListTransactionsQuery,
    useAddAccountMutation,
    useListAccountQuery,
    useAddCategoryMutation,
    useListCategoriesQuery
} = api
