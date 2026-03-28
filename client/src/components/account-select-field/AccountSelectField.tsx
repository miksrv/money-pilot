import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { SelectOptionType, SelectProps } from 'simple-react-ui-kit'
import { Select } from 'simple-react-ui-kit'

import { useListAccountQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

interface AccountSelectFieldProps extends SelectProps<string> {
    enableAutoSelect?: boolean
    groupId?: string
    excludeId?: string
}

export const AccountSelectField: React.FC<AccountSelectFieldProps> = ({
    enableAutoSelect,
    groupId,
    excludeId,
    ...props
}) => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const hasAutoSelected = useRef(false)

    const { data, isLoading } = useListAccountQuery(groupId ? { group_id: groupId } : undefined, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const options: Array<SelectOptionType<string>> = useMemo(
        () =>
            (data ?? [])
                .filter((account) => account.id !== excludeId)
                .map((account) => ({
                    key: account?.id || '',
                    value: account?.name || ''
                })),
        [data, excludeId]
    )

    useEffect(() => {
        if (enableAutoSelect && !hasAutoSelected.current && !props.value && options.length > 0) {
            hasAutoSelected.current = true
            props.onSelect?.([options[0]])
        }
    }, [enableAutoSelect, options, props.value])

    // Reset autoselect flag when value is cleared
    useEffect(() => {
        if (!props.value) {
            hasAutoSelected.current = false
        }
    }, [props.value])

    return (
        <Select<string>
            loading={isLoading}
            disabled={isLoading}
            placeholder={t('accounts.selectPlaceholder', 'Select an account')}
            options={options}
            {...props}
        />
    )
}
