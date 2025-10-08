import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DropdownOption, DropdownProps } from 'simple-react-ui-kit'
import { Dropdown } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'

export const CategorySelectField: React.FC<DropdownProps<string>> = (props) => {
    const { t } = useTranslation()
    const { data, isLoading } = useListCategoriesQuery()

    const options: Array<DropdownOption<string>> = useMemo(
        () =>
            data?.map((category) => ({
                key: category?.id,
                value: category?.name
                // icon: category?.icon
            })) || [],
        [data]
    )

    return (
        <Dropdown<string>
            loading={isLoading}
            disabled={isLoading}
            placeholder={t('categories.selectPlaceholder', 'Select a category')}
            options={options}
            {...props}
        />
    )
}
