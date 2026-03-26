import React from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Message } from 'simple-react-ui-kit'

import { useGetPendingInvitationsQuery } from '@/api'
import { useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

export const PendingInvitationBanner: React.FC = () => {
    const { t } = useTranslation()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth.isAuth)
    const { data: pendingInvitations } = useGetPendingInvitationsQuery(undefined, {
        skip: !isAuth,
        refetchOnMountOrArgChange: true
    })

    const count = pendingInvitations?.length ?? 0

    if (count === 0) {
        return null
    }

    const firstInvitation = pendingInvitations![0]

    return (
        <div className={styles.pendingInvitationBanner}>
            <Message type='info'>
                <div className={styles.pendingInvitationBannerContent}>
                    <span>
                        {count === 1
                            ? t('groups.invitationBannerSingle', '{{name}} invited you to view their budget', {
                                  name: firstInvitation.inviter_name
                              })
                            : t('groups.invitationBannerMultiple', 'You have {{count}} pending budget invitations', {
                                  count
                              })}
                    </span>
                    <Button
                        mode='primary'
                        size='medium'
                        label={t('groups.viewInvitations', 'View')}
                        onClick={() => navigate('/settings#pending-invitations')}
                    />
                </div>
            </Message>
        </div>
    )
}
