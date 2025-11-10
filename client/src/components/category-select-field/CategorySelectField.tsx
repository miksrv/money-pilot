import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { DropdownOption, DropdownProps } from 'simple-react-ui-kit'
import { Dropdown } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'

interface CategorySelectFieldProps extends DropdownProps<string> {
    enableAutoSelect?: boolean
}

export const CategorySelectField: React.FC<CategorySelectFieldProps> = ({ enableAutoSelect, ...props }) => {
    const { t } = useTranslation()
    const { data, isLoading } = useListCategoriesQuery()

    const options: Array<DropdownOption<string>> = useMemo(
        () =>
            data?.map((category) => ({
                key: category?.id || '',
                value: category?.name || '',
                emoji: category?.icon
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
            placeholder={t('categories.selectPlaceholder', 'Select a category')}
            options={options}
            {...props}
        />
    )
}
