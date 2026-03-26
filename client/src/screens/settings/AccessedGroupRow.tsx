import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Dialog, Message } from 'simple-react-ui-kit'

import { ApiModel, useGetGroupMembersQuery, useRemoveMemberMutation } from '@/api'
import { setActiveGroup } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

interface AccessedGroupRowProps {
    group: ApiModel.Group
    currentUserId: string
}

export const AccessedGroupRow: React.FC<AccessedGroupRowProps> = ({ group, currentUserId }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: members } = useGetGroupMembersQuery(group.id, { skip: !isAuth })
    const [removeMember] = useRemoveMemberMutation()

    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
    const [leaveError, setLeaveError] = useState(false)

    const myMember = members?.find((m) => m.user_id === currentUserId)

    const handleLeave = async () => {
        if (!myMember) {
            return
        }
        setLeaveError(false)
        try {
            await removeMember({ groupId: group.id, memberId: myMember.id }).unwrap()
            dispatch(setActiveGroup(null))
            setLeaveConfirmOpen(false)
        } catch {
            setLeaveError(true)
        }
    }

    return (
        <div className={styles.accessedGroupRow}>
            <div className={styles.accessedGroupInfo}>
                <span className={styles.accessedGroupName}>{group.name}</span>
                {myMember && (
                    <Badge
                        label={t('groups.role.' + myMember.role, myMember.role)}
                        size='small'
                    />
                )}
            </div>
            <div className={styles.accessedGroupActions}>
                <Button
                    mode='secondary'
                    label={t('groups.joinGoTo', "View {{name}}'s Budget", { name: group.name })}
                    onClick={() => {
                        dispatch(setActiveGroup(group.id))
                        void navigate('/')
                    }}
                />
                <Button
                    mode='outline'
                    variant='negative'
                    label={t('groups.leaveGroup', 'Leave')}
                    onClick={() => setLeaveConfirmOpen(true)}
                />
            </div>

            <Dialog
                open={leaveConfirmOpen}
                title={t('groups.leaveGroup', 'Leave Shared Budget')}
                onCloseDialog={() => {
                    setLeaveConfirmOpen(false)
                    setLeaveError(false)
                }}
            >
                <Message type='warning'>
                    {t('groups.leaveConfirm', 'Leave this shared budget? You will lose access to this budget.')}
                </Message>
                {leaveError && (
                    <Message type='error'>{t('common.errors.unknown', 'An error occurred. Please try again.')}</Message>
                )}
                <Button
                    mode='primary'
                    variant='negative'
                    label={t('groups.leaveGroup', 'Leave')}
                    onClick={handleLeave}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setLeaveConfirmOpen(false)}
                    stretched
                />
            </Dialog>
        </div>
    )
}
