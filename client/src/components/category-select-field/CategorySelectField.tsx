import React, { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { SelectOptionType, SelectProps } from 'simple-react-ui-kit'
import { Select } from 'simple-react-ui-kit'

import { useListCategoriesQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

interface CategorySelectFieldProps extends SelectProps<string> {
    enableAutoSelect?: boolean
    groupId?: string
}

export const CategorySelectField: React.FC<CategorySelectFieldProps> = ({ enableAutoSelect, groupId, ...props }) => {
    const { t } = useTranslation()

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const hasAutoSelected = useRef(false)

    const { data, isLoading } = useListCategoriesQuery(groupId ? { group_id: groupId } : {}, {
        refetchOnReconnect: true,
        skip: !isAuth
    })

    const options: Array<SelectOptionType<string>> = useMemo(
        () =>
            (data ?? [])
                .filter((category) => !category.is_parent)
                .map((category) => ({
                    key: category?.id || '',
                    value: category?.name || '',
                    emoji: category?.icon
                })),
        [data]
    )

    useEffect(() => {
        if (enableAutoSelect && !hasAutoSelected.current && !props.value && options.length > 0) {
            hasAutoSelected.current = true
            props.onSelect?.([options[0]])
        }
    }, [enableAutoSelect, options, props.value])

    // Reset autoselect flag when dialog closes/opens
    useEffect(() => {
        if (!props.value) {
            hasAutoSelected.current = false
        }
    }, [props.value])

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
