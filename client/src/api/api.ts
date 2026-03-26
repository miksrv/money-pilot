import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

import type { RootState } from '@/store'

import { ApiModel, ApiType } from './index'

export const encodeQueryData = (data: Record<string, string | number | boolean | undefined | null> | void): string => {
    if (!data) {
        return ''
    }

    const ret: string[] = []

    for (const d in data) {
        if (d && data[d] != null && data[d] !== '') {
            ret.push(encodeURIComponent(d) + '=' + encodeURIComponent(String(data[d])))
        }
    }

    return ret.length ? '?' + ret.join('&') : ''
}

export const HOST_API = 'http://localhost:8080/'

export interface ApiError {
    status: number
    messages: {
        [field: string]: string | undefined
        error?: string
    }
}

export const api = createApi({
    reducerPath: 'api',
    tagTypes: ['Category', 'Transaction', 'Account', 'Dashboard', 'User', 'Recurring', 'Payee', 'Report', 'Group'],
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
            invalidatesTags: [{ id: 'LIST', type: 'Account' }],
            query: (body) => ({
                url: 'accounts',
                method: 'POST',
                body
            })
        }),
        /* List accounts */
        listAccount: builder.query<ApiModel.Account[], { group_id?: string } | void>({
            providesTags: [{ id: 'LIST', type: 'Account' }],
            query: (params) => `accounts${encodeQueryData(params ?? {})}`
        }),
        /* Update account */
        updateAccount: builder.mutation<ApiModel.Account, { id: string } & Partial<ApiModel.Account>>({
            invalidatesTags: [{ id: 'LIST', type: 'Account' }],
            query: ({ id, ...body }) => ({ url: `accounts/${id}`, method: 'PUT', body })
        }),
        /* Delete account */
        deleteAccount: builder.mutation<void, string>({
            invalidatesTags: [
                { id: 'LIST', type: 'Account' },
                { id: 'LIST', type: 'Transaction' }
            ],
            query: (id) => ({ url: `accounts/${id}`, method: 'DELETE' })
        }),
        /* List transactions */
        listTransactions: builder.query<ApiModel.TransactionListResponse, ApiModel.TransactionListParams | void>({
            providesTags: () => [{ id: 'LIST', type: 'Transaction' }],
            query: (params) => `/transactions${encodeQueryData(params)}`
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
        /* Delete Transaction */
        deleteTransaction: builder.mutation<void, string>({
            invalidatesTags: [
                { id: 'LIST', type: 'Transaction' },
                { id: 'LIST', type: 'Account' }
            ],
            query: (id) => ({ url: `transactions/${id}`, method: 'DELETE' })
        }),
        /* Bulk delete transactions */
        bulkDeleteTransactions: builder.mutation<{ deleted: number }, { ids: string[] }>({
            invalidatesTags: [
                { id: 'LIST', type: 'Transaction' },
                { id: 'SUMMARY', type: 'Dashboard' }
            ],
            query: (body) => ({ url: 'transactions/bulk-delete', method: 'POST', body })
        }),
        /* List Categories */
        listCategories: builder.query<
            ApiType.Category.Response[],
            { withSums?: boolean; include_archived?: number; withChildren?: boolean; group_id?: string } | void
        >({
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
        }),
        /* Delete Category */
        deleteCategory: builder.mutation<void, string>({
            invalidatesTags: [{ id: 'LIST', type: 'Category' }],
            query: (id) => ({ url: `categories/${id}`, method: 'DELETE' })
        }),
        /* Archive Category */
        archiveCategory: builder.mutation<ApiModel.Category, { id: string; archived: boolean }>({
            invalidatesTags: [{ id: 'LIST', type: 'Category' }],
            query: ({ id, archived }) => ({
                url: `categories/${id}/archive`,
                method: 'PATCH',
                body: { archived }
            })
        }),
        /* Get dashboard summary */
        getDashboardSummary: builder.query<ApiModel.DashboardSummary, { month?: string; group_id?: string } | void>({
            providesTags: [{ id: 'SUMMARY', type: 'Dashboard' }],
            query: (param) => `/dashboard/summary${encodeQueryData(param)}`
        }),
        /* Get monthly spending */
        getMonthlySpending: builder.query<ApiModel.MonthlySpendingResponse, { group_id?: string } | void>({
            providesTags: [{ id: 'MONTHLY_SPENDING', type: 'Dashboard' }],
            query: (param) => `/dashboard/monthly-spending${encodeQueryData(param ?? {})}`
        }),
        /* Get user profile */
        getProfile: builder.query<ApiModel.UserProfile, void>({
            providesTags: [{ id: 'PROFILE', type: 'User' }],
            query: () => 'users/profile'
        }),
        /* Update profile */
        updateProfile: builder.mutation<ApiModel.UserProfile, ApiModel.UpdateProfileBody>({
            invalidatesTags: [{ id: 'PROFILE', type: 'User' }],
            query: (body) => ({ url: 'users/profile', method: 'PUT', body })
        }),
        /* Change password */
        changePassword: builder.mutation<void, ApiModel.ChangePasswordBody>({
            query: (body) => ({ url: 'users/password', method: 'PUT', body })
        }),
        /* Delete my account */
        deleteMyAccount: builder.mutation<void, void>({
            query: () => ({ url: 'users/me', method: 'DELETE' })
        }),
        /* List recurring transactions */
        listRecurring: builder.query<ApiModel.RecurringTransaction[], { group_id?: string } | void>({
            providesTags: [{ id: 'LIST', type: 'Recurring' }],
            query: (params) => `/recurring${encodeQueryData(params)}`
        }),
        /* Add recurring transaction */
        addRecurring: builder.mutation<ApiModel.RecurringTransaction, ApiModel.CreateRecurringBody>({
            invalidatesTags: [{ id: 'LIST', type: 'Recurring' }],
            query: (body) => ({ url: '/recurring', method: 'POST', body })
        }),
        /* Update recurring transaction */
        updateRecurring: builder.mutation<
            ApiModel.RecurringTransaction,
            { id: string } & Partial<ApiModel.CreateRecurringBody>
        >({
            invalidatesTags: [{ id: 'LIST', type: 'Recurring' }],
            query: ({ id, ...body }) => ({ url: `/recurring/${id}`, method: 'PUT', body })
        }),
        /* Delete recurring transaction */
        deleteRecurring: builder.mutation<void, string>({
            invalidatesTags: [{ id: 'LIST', type: 'Recurring' }],
            query: (id) => ({ url: `/recurring/${id}`, method: 'DELETE' })
        }),
        /* Generate transaction from recurring */
        generateRecurring: builder.mutation<ApiModel.Transaction, string>({
            invalidatesTags: [
                { id: 'LIST', type: 'Recurring' },
                { id: 'LIST', type: 'Transaction' },
                { id: 'LIST', type: 'Account' }
            ],
            query: (id) => ({ url: `/recurring/${id}/generate`, method: 'POST' })
        }),
        /* Toggle recurring active/paused */
        toggleRecurring: builder.mutation<ApiModel.RecurringTransaction, string>({
            invalidatesTags: [{ id: 'LIST', type: 'Recurring' }],
            query: (id) => ({ url: `/recurring/${id}/toggle`, method: 'PATCH' })
        }),
        /* List payees */
        listPayees: builder.query<ApiModel.Payee[], { search?: string } | void>({
            providesTags: [{ id: 'LIST', type: 'Payee' }],
            query: (params) => `/payees${encodeQueryData(params)}`
        }),
        /* Update payee */
        updatePayee: builder.mutation<ApiModel.Payee, { id: string; name: string }>({
            invalidatesTags: [{ id: 'LIST', type: 'Payee' }],
            query: ({ id, ...body }) => ({ url: `/payees/${id}`, method: 'PUT', body })
        }),
        /* Delete payee */
        deletePayee: builder.mutation<void, string>({
            invalidatesTags: [{ id: 'LIST', type: 'Payee' }],
            query: (id) => ({ url: `/payees/${id}`, method: 'DELETE' })
        }),
        /* Merge payees */
        mergePayees: builder.mutation<void, { sourceId: string; targetId: string }>({
            invalidatesTags: [
                { id: 'LIST', type: 'Payee' },
                { id: 'LIST', type: 'Transaction' }
            ],
            query: ({ sourceId, targetId }) => ({
                url: `/payees/${sourceId}/merge`,
                method: 'POST',
                body: { target_id: targetId }
            })
        }),
        /* Reports — spending by category */
        getSpendingByCategory: builder.query<ApiModel.CategorySpend[], ApiModel.ReportParams>({
            providesTags: [{ id: 'SPENDING', type: 'Report' }],
            query: (params) => `/reports/spending-by-category${encodeQueryData(params)}`
        }),
        /* Reports — income vs expense */
        getIncomeExpense: builder.query<ApiModel.MonthlyIncomeExpense[], ApiModel.ReportParams>({
            providesTags: [{ id: 'INCOME_EXPENSE', type: 'Report' }],
            query: (params) => `/reports/income-expense${encodeQueryData(params)}`
        }),
        /* Reports — spending trend */
        getSpendingTrend: builder.query<ApiModel.DailySpend[], ApiModel.ReportParams>({
            providesTags: [{ id: 'TREND', type: 'Report' }],
            query: (params) => `/reports/spending-trend${encodeQueryData(params)}`
        }),
        /* Reports — net worth history */
        getNetWorth: builder.query<ApiModel.MonthlyNetWorth[], ApiModel.ReportParams>({
            providesTags: [{ id: 'NET_WORTH', type: 'Report' }],
            query: (params) => `/reports/net-worth${encodeQueryData(params)}`
        }),
        /* Reports — top payees */
        getTopPayees: builder.query<ApiModel.PayeeSpend[], ApiModel.ReportParams>({
            providesTags: [{ id: 'TOP_PAYEES', type: 'Report' }],
            query: (params) => `/reports/top-payees${encodeQueryData(params)}`
        }),
        /* List groups */
        listGroups: builder.query<ApiModel.Group[], void>({
            providesTags: ['Group'],
            query: () => '/groups'
        }),
        /* Create group */
        createGroup: builder.mutation<ApiModel.Group, { name: string; description?: string }>({
            invalidatesTags: ['Group'],
            query: (body) => ({ url: '/groups', method: 'POST', body })
        }),
        /* Delete group */
        deleteGroup: builder.mutation<void, string>({
            invalidatesTags: ['Group'],
            query: (id) => ({ url: `/groups/${id}`, method: 'DELETE' })
        }),
        /* Get group members */
        getGroupMembers: builder.query<ApiModel.GroupMember[], string>({
            providesTags: ['Group'],
            query: (groupId) => `/groups/${groupId}/members`
        }),
        /* Remove member */
        removeMember: builder.mutation<void, { groupId: string; memberId: string }>({
            invalidatesTags: ['Group'],
            query: ({ groupId, memberId }) => ({ url: `/groups/${groupId}/members/${memberId}`, method: 'DELETE' })
        }),
        /* Get group invitations */
        getGroupInvitations: builder.query<ApiModel.GroupInvitation[], string>({
            providesTags: ['Group'],
            query: (groupId) => `/groups/${groupId}/invitations`
        }),
        /* Invite member */
        inviteMember: builder.mutation<
            { token: string; expires_at: string },
            { groupId: string; body: ApiModel.InviteMemberBody }
        >({
            invalidatesTags: ['Group'],
            query: ({ groupId, body }) => ({ url: `/groups/${groupId}/invite`, method: 'POST', body })
        }),
        /* Revoke invitation */
        revokeInvitation: builder.mutation<void, { groupId: string; invitationId: string }>({
            invalidatesTags: ['Group'],
            query: ({ groupId, invitationId }) => ({
                url: `/groups/${groupId}/invitations/${invitationId}`,
                method: 'DELETE'
            })
        }),
        /* Get pending invitations for current user */
        getPendingInvitations: builder.query<ApiModel.PendingInvitation[], void>({
            providesTags: ['Group'],
            query: () => '/groups/pending-invitations'
        }),
        /* Join group via token */
        joinGroup: builder.mutation<ApiModel.Group & { owner_name: string }, { token: string }>({
            invalidatesTags: ['Group'],
            query: (body) => ({ url: '/groups/join', method: 'POST', body })
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
    useDeleteTransactionMutation,
    useBulkDeleteTransactionsMutation,
    useAddAccountMutation,
    useListAccountQuery,
    useUpdateAccountMutation,
    useDeleteAccountMutation,
    useAddCategoryMutation,
    useListCategoriesQuery,
    useUpdateCategoryMutation,
    useDeleteCategoryMutation,
    useArchiveCategoryMutation,
    useUpdateTransactionMutation,
    useGetDashboardSummaryQuery,
    useGetMonthlySpendingQuery,
    useGetProfileQuery,
    useUpdateProfileMutation,
    useChangePasswordMutation,
    useDeleteMyAccountMutation,
    useListRecurringQuery,
    useAddRecurringMutation,
    useUpdateRecurringMutation,
    useDeleteRecurringMutation,
    useGenerateRecurringMutation,
    useToggleRecurringMutation,
    useListPayeesQuery,
    useUpdatePayeeMutation,
    useDeletePayeeMutation,
    useMergePayeesMutation,
    useGetSpendingByCategoryQuery,
    useGetIncomeExpenseQuery,
    useGetSpendingTrendQuery,
    useGetNetWorthQuery,
    useGetTopPayeesQuery,
    useListGroupsQuery,
    useCreateGroupMutation,
    useDeleteGroupMutation,
    useGetGroupMembersQuery,
    useRemoveMemberMutation,
    useGetGroupInvitationsQuery,
    useInviteMemberMutation,
    useRevokeInvitationMutation,
    useGetPendingInvitationsQuery,
    useJoinGroupMutation
} = api
