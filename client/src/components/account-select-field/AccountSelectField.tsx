import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DropdownOption, DropdownProps } from 'simple-react-ui-kit'
import { Dropdown } from 'simple-react-ui-kit'

import { useListAccountQuery } from '@/api'

export const AccountSelectField: React.FC<DropdownProps<string>> = (props) => {
    const { t } = useTranslation()
    const { data, isLoading } = useListAccountQuery()

    const options: Array<DropdownOption<string>> = useMemo(
        () =>
            data?.map((account) => ({
                key: account?.id,
                value: account?.name
                // icon: category?.icon
            })) || [],
        [data]
    )

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
