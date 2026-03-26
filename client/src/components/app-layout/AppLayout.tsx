import React, { PropsWithChildren, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, cn } from 'simple-react-ui-kit'

import { useGetGroupMembersQuery, useGetProfileQuery, useListGroupsQuery } from '@/api'
import { setActiveGroup } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import { AppBar, AppBarProps } from '../app-bar'

import Menu from './Menu'
import { PendingInvitationBanner } from './PendingInvitationBanner'

import styles from './styles.module.sass'

const SIDEBAR_KEY = 'sidebarExpanded'

function isMobileViewport() {
    return window.innerWidth < 726
}

export interface AppLayoutProps extends PropsWithChildren<AppBarProps> {
    size?: 'small' | 'medium' | 'large'
}

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const activeGroupId = useAppSelector((state) => state.auth.activeGroupId)

    const { data: groups } = useListGroupsQuery(undefined, { skip: !isAuth })
    const { data: profile } = useGetProfileQuery(undefined, { skip: !isAuth })

    const activeGroup = activeGroupId ? (groups?.find((g) => g.id === activeGroupId) ?? null) : null

    const { data: members } = useGetGroupMembersQuery(activeGroupId ?? '', {
        skip: !isAuth || !activeGroupId
    })

    const myMember = members?.find((m) => m.user_id === profile?.id)

    let myRole: 'owner' | 'editor' | 'viewer' | null = null
    if (activeGroup) {
        myRole = activeGroup.owner_id === profile?.id ? 'owner' : (myMember?.role ?? 'viewer')
    }

    const [isMobile, setIsMobile] = useState(isMobileViewport)

    const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
        if (isMobileViewport()) {
            return false
        }
        return localStorage.getItem(SIDEBAR_KEY) !== 'false'
    })

    const toggleSidebar = () => {
        setSidebarOpen((prev) => {
            const next = !prev
            if (!isMobileViewport()) {
                localStorage.setItem(SIDEBAR_KEY, String(next))
            }
            return next
        })
    }

    useEffect(() => {
        const handleResize = () => {
            const mobile = isMobileViewport()
            setIsMobile(mobile)
            if (!mobile) {
                setSidebarOpen(localStorage.getItem(SIDEBAR_KEY) !== 'false')
            } else {
                setSidebarOpen(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    return (
        <div className={styles.appLayout}>
            <aside
                className={cn(
                    styles.sidebar,
                    isMobile ? sidebarOpen && styles.mobileOpen : !sidebarOpen && styles.collapsed
                )}
            >
                <Menu
                    collapsed={!isMobile && !sidebarOpen}
                    onClick={isMobile ? () => setSidebarOpen(false) : undefined}
                />
            </aside>

            {isMobile && (
                <div
                    className={cn(styles.overlay, sidebarOpen && styles.displayed)}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <main className={styles.main}>
                <AppBar
                    actions={props.actions}
                    onToggle={toggleSidebar}
                />

                {activeGroup && (
                    <div className={styles.groupBanner}>
                        <div className={styles.groupBannerLeft}>
                            <span
                                className={styles.groupBannerIcon}
                                aria-hidden='true'
                            >
                                👁
                            </span>
                            <span className={styles.groupBannerText}>
                                {t('groups.viewingBudget', "Viewing {{name}}'s Budget", { name: activeGroup.name })}
                            </span>
                            {myRole && (
                                <Badge
                                    label={t('groups.role.' + myRole, myRole)}
                                    size='small'
                                />
                            )}
                        </div>
                        {myRole === 'owner' ? (
                            <Button
                                mode='link'
                                label={t('common.settings', 'Settings')}
                                onClick={() => void navigate('/settings')}
                            />
                        ) : (
                            <Button
                                mode='link'
                                label={t('groups.myBudget', 'My Budget')}
                                onClick={() => dispatch(setActiveGroup(null))}
                            />
                        )}
                    </div>
                )}

                <div className={styles.content}>
                    <PendingInvitationBanner />
                    {props.children}
                </div>
            </main>
        </div>
    )
}
