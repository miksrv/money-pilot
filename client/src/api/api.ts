import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { RootState } from '@/store'

import { ApiModel, ApiType } from './index'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const encodeQueryData = (data: any): string => {
    const ret = []
    for (const d in data) {
        if (d && data[d]) {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(data[d]))
        }
    }

    return ret.length ? '?' + ret.join('&') : ''
}

export const HOST_API = 'http://localhost:8080/'

export interface ApiError {
    status: number
    messages: {
        error?: string
    }
}

export const api = createApi({
    reducerPath: 'api',
    tagTypes: ['Category', 'Transaction'],
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
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            query: (body) => ({
                body,
                method: 'POST',
                url: 'register'
            })
        }),
        /* Login */
        login: builder.mutation<ApiType.Registration.Response, ApiType.Registration.Request>({
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            query: (body) => ({
                body,
                method: 'POST',
                url: 'auth/login'
            })
        }),
        /* Logout */
        logout: builder.mutation<void, void>({
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            query: () => ({
                method: 'GET',
                url: 'auth/logout'
            })
        }),
        /* Get me */
        me: builder.query<ApiType.Registration.Response, void>({
            transformErrorResponse: (response) => response.data,
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
        /* Add Transaction */
        addTransaction: builder.mutation<void, ApiType.Transaction.Request>({
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            invalidatesTags: (_result, error) => (!error ? [{ id: 'LIST', type: 'Transaction' }] : []),
            query: (body) => ({
                url: 'transactions',
                method: 'POST',
                body
            })
        }),
        /* Update Transaction */
        updateTransaction: builder.mutation<void, Partial<ApiModel.Transaction>>({
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            invalidatesTags: (_result, error) => (!error ? [{ id: 'LIST', type: 'Transaction' }] : []),
            query: ({ id, ...formData }) => ({
                url: `transactions/${id}`,
                method: 'PUT',
                body: formData
            })
        }),
        /* List Categories */
        listCategories: builder.query<ApiType.Category.Response[], { withSums?: boolean } | void>({
            providesTags: () => [{ id: 'LIST', type: 'Category' }],
            query: (param) => `/categories${encodeQueryData(param)}`
        }),
        /* Add Category */
        addCategory: builder.mutation<void, ApiType.Category.Request>({
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            invalidatesTags: (_result, error) => (!error ? [{ id: 'LIST', type: 'Category' }] : []),
            query: (body) => ({
                url: 'categories',
                method: 'POST',
                body
            })
        }),
        /* Update Category */
        updateCategory: builder.mutation<void, Partial<ApiModel.Category>>({
            transformErrorResponse: (response) => (response.data as ApiError)?.messages?.error,
            invalidatesTags: (_result, error) => (!error ? [{ id: 'LIST', type: 'Category' }] : []),
            query: ({ id, ...formData }) => ({
                url: `categories/${id}`,
                method: 'PUT',
                body: formData
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
    useListCategoriesQuery,
    useUpdateCategoryMutation,
    useUpdateTransactionMutation
} = api
