import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DropdownOption, DropdownProps } from 'simple-react-ui-kit'
import { Dropdown } from 'simple-react-ui-kit'

import { useListAccountQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

interface AccountSelectFieldProps extends DropdownProps<string> {
    enableAutoSelect?: boolean
}

export const AccountSelectField: React.FC<AccountSelectFieldProps> = ({ enableAutoSelect, ...props }) => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth)

    const { data, isLoading } = useListAccountQuery({}, { refetchOnReconnect: true, skip: !isAuth })

    const options: Array<DropdownOption<string>> = useMemo(
        () =>
            data?.map((account) => ({
                key: account?.id || '',
                value: account?.name || ''
            })) || [],
        [data]
    )

    useEffect(() => {
        if (enableAutoSelect && !props.value && !!options?.length) {
            props?.onSelect?.(options?.[0])
        }
    }, [props?.value, options])

    return (
        <Dropdown<string>
            loading={isLoading}
            disabled={isLoading}
            mode={'secondary'}
            placeholder={t('categories.selectPlaceholder', 'Select an account')}
            options={options}
            {...props}
        />
    )
}
