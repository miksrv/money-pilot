import React, { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SelectOptionType, SelectProps } from 'simple-react-ui-kit'
import { Select } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

interface CategorySelectFieldProps extends SelectProps<string> {
    enableAutoSelect?: boolean
}

export const CategorySelectField: React.FC<CategorySelectFieldProps> = ({ enableAutoSelect, ...props }) => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data, isLoading } = useListCategoriesQuery({}, { refetchOnReconnect: true, skip: !isAuth })

    const options: Array<SelectOptionType<string>> = useMemo(
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
            props?.onSelect?.(options)
        }
    }, [props?.value, options])

    return (
        <Select<string>
            loading={isLoading}
            disabled={isLoading}
            placeholder={t('categories.selectPlaceholder', 'Select a category')}
            options={options}
            {...props}
        />
    )
}
