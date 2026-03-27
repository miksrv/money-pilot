import { useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'

import { api, useGetGroupLastModifiedQuery, useGetProfileQuery, useListGroupsQuery } from '@/api'
import { bumpGroupSync } from '@/store/authSlice'
import { useAppSelector } from '@/store/hooks'

export const useGroupSync = () => {
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)
    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const dispatch = useDispatch()
    const lastModifiedRef = useRef<string | null>(null)
    const prevGroupIdRef = useRef<string | null>(null)

    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })
    const { data: groups } = useListGroupsQuery(undefined, { skip: !isAuth })

    // Editors use activeGroupId; owners find their first owned group
    const ownedGroupId = groups?.find((g) => g.owner_id === profile?.id)?.id ?? null
    const groupIdToSync = activeGroupId ?? ownedGroupId

    // Reset timestamp ref when the synced group changes
    if (prevGroupIdRef.current !== groupIdToSync) {
        prevGroupIdRef.current = groupIdToSync
        lastModifiedRef.current = null
    }

    const { data } = useGetGroupLastModifiedQuery(groupIdToSync ?? '', {
        skip: !groupIdToSync,
        pollingInterval: 5000,
        skipPollingIfUnfocused: true
    })

    useEffect(() => {
        if (!data?.last_modified) {
            return
        }

        if (lastModifiedRef.current == null) {
            lastModifiedRef.current = data.last_modified
            return
        }

        if (data.last_modified !== lastModifiedRef.current) {
            lastModifiedRef.current = data.last_modified
            dispatch(bumpGroupSync())
            dispatch(api.util.invalidateTags(['Transaction', 'Category', 'Account', 'Dashboard']))
        }
    }, [data?.last_modified, dispatch])
}
