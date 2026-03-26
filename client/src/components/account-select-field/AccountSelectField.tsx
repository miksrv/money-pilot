import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SelectOptionType, SelectProps } from 'simple-react-ui-kit'
import { Select } from 'simple-react-ui-kit'

import { useListAccountQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

interface AccountSelectFieldProps extends SelectProps<string> {
    enableAutoSelect?: boolean
}

export const AccountSelectField: React.FC<AccountSelectFieldProps> = ({ enableAutoSelect, ...props }) => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data, isLoading } = useListAccountQuery(undefined, { refetchOnReconnect: true, skip: !isAuth })

    const options: Array<SelectOptionType<string>> = useMemo(
        () =>
            data?.map((account) => ({
                key: account?.id || '',
                value: account?.name || ''
            })) || [],
        [data]
    )

    useEffect(() => {
        if (enableAutoSelect && !props.value && !!options?.length) {
            props?.onSelect?.(options)
        }
    }, [props?.value, options])

    return (
        <Select<string>
            loading={isLoading}
            disabled={isLoading}
            placeholder={t('categories.selectPlaceholder', 'Select an account')}
            options={options}
            {...props}
        />
    )
}
