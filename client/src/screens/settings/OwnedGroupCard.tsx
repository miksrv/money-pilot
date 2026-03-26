import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, Dialog, Message } from 'simple-react-ui-kit'

import {
    ApiModel,
    useDeleteGroupMutation,
    useGetGroupInvitationsQuery,
    useGetGroupMembersQuery,
    useRemoveMemberMutation,
    useRevokeInvitationMutation
} from '@/api'
import { setActiveGroup } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { formatUTCDate } from '@/utils/dates'

import { memberInitials } from './utils'

import styles from './styles.module.sass'

interface OwnedGroupCardProps {
    group: ApiModel.Group
    currentUserId: string
    onInvite: (groupId?: string) => void
}

export const OwnedGroupCard: React.FC<OwnedGroupCardProps> = ({ group, currentUserId, onInvite }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: members } = useGetGroupMembersQuery(group.id, { skip: !isAuth })
    const { data: invitations } = useGetGroupInvitationsQuery(group.id, { skip: !isAuth })

    const [removeMember] = useRemoveMemberMutation()
    const [revokeInvitation] = useRevokeInvitationMutation()
    const [deleteGroup] = useDeleteGroupMutation()

    const [removeConfirmId, setRemoveConfirmId] = useState<string | undefined>()
    const [revokeConfirmId, setRevokeConfirmId] = useState<string | undefined>()
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
    const [actionError, setActionError] = useState<string | undefined>()

    const handleRemoveMember = async (memberId: string) => {
        setActionError(undefined)
        try {
            await removeMember({ groupId: group.id, memberId }).unwrap()
            setRemoveConfirmId(undefined)
        } catch {
            setActionError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    const handleRevokeInvitation = async (invitationId: string) => {
        setActionError(undefined)
        try {
            await revokeInvitation({ groupId: group.id, invitationId }).unwrap()
            setRevokeConfirmId(undefined)
        } catch {
            setActionError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    const handleDeleteGroup = async () => {
        setActionError(undefined)
        try {
            await deleteGroup(group.id).unwrap()
            dispatch(setActiveGroup(null))
            setDeleteConfirmOpen(false)
        } catch {
            setActionError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    return (
        <div className={styles.groupCard}>
            <div className={styles.groupCardHeader}>
                <strong>{group.name}</strong>
            </div>

            {/* Members */}
            {members && members.length > 0 && (
                <div className={styles.groupSection}>
                    {members.map((member) => (
                        <div
                            className={styles.memberRow}
                            key={member.id}
                        >
                            <div className={styles.memberAvatar}>{memberInitials(member.name)}</div>
                            <div className={styles.memberInfo}>
                                <span className={styles.memberName}>{member.name}</span>
                                <span className={styles.memberEmail}>{member.email}</span>
                            </div>
                            <Badge
                                label={t('groups.role.' + member.role, member.role)}
                                size='small'
                            />
                            {member.role !== 'owner' && member.user_id !== currentUserId && (
                                <Button
                                    mode='link'
                                    variant='negative'
                                    icon='Close'
                                    label={t('groups.removeMember', 'Remove')}
                                    onClick={() => setRemoveConfirmId(member.id)}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pending invitations */}
            {invitations && invitations.length > 0 && (
                <div className={styles.groupSection}>
                    <div className={styles.groupSectionTitle}>
                        {t('groups.pendingInvitations', 'Pending Invitations')}
                    </div>
                    {invitations.map((inv) => (
                        <div
                            className={styles.invitationRow}
                            key={inv.id}
                        >
                            <span className={styles.invitationEmail}>{inv.email}</span>
                            <Badge
                                label={t('groups.role.' + inv.role, inv.role)}
                                size='small'
                            />
                            <span className={styles.invitationExpiry}>
                                {t('groups.expiresAt', 'Expires {{date}}', {
                                    date: formatUTCDate(inv.expires_at, 'DD.MM.YYYY')
                                })}
                            </span>
                            <Button
                                mode='link'
                                variant='negative'
                                icon='Close'
                                label={t('groups.revokeInvitation', 'Revoke')}
                                onClick={() => setRevokeConfirmId(inv.id)}
                            />
                        </div>
                    ))}
                </div>
            )}

            {actionError && <Message type='error'>{actionError}</Message>}

            {/* Actions */}
            <div className={styles.groupActions}>
                <Button
                    mode='secondary'
                    icon='PlusCircle'
                    label={t('groups.shareMyBudget', 'Invite Someone')}
                    onClick={() => onInvite(group.id)}
                />
                <Button
                    mode='outline'
                    variant='negative'
                    label={t('groups.deleteGroup', 'Delete Shared Budget')}
                    onClick={() => setDeleteConfirmOpen(true)}
                />
            </div>

            {/* Remove member confirm */}
            <Dialog
                open={!!removeConfirmId}
                title={t('groups.removeMember', 'Remove Member')}
                onCloseDialog={() => setRemoveConfirmId(undefined)}
            >
                <Message type='warning'>
                    {t('groups.removeConfirm', 'Remove this member from your shared budget?')}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={t('groups.removeMember', 'Remove')}
                    onClick={() => removeConfirmId && handleRemoveMember(removeConfirmId)}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setRemoveConfirmId(undefined)}
                    stretched
                />
            </Dialog>

            {/* Revoke invitation confirm */}
            <Dialog
                open={!!revokeConfirmId}
                title={t('groups.revokeInvitation', 'Revoke Invitation')}
                onCloseDialog={() => setRevokeConfirmId(undefined)}
            >
                <Message type='warning'>{t('groups.revokeConfirm', 'Revoke this invitation?')}</Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={t('groups.revokeInvitation', 'Revoke')}
                    onClick={() => revokeConfirmId && handleRevokeInvitation(revokeConfirmId)}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setRevokeConfirmId(undefined)}
                    stretched
                />
            </Dialog>

            {/* Delete group confirm */}
            <Dialog
                open={deleteConfirmOpen}
                title={t('groups.deleteGroup', 'Delete Shared Budget')}
                onCloseDialog={() => setDeleteConfirmOpen(false)}
            >
                <Message type='error'>
                    {t('groups.deleteConfirm', 'Permanently delete this shared budget? All members will lose access.')}
                </Message>
                <Button
                    mode='primary'
                    variant='negative'
                    label={t('groups.deleteGroup', 'Delete Shared Budget')}
                    onClick={handleDeleteGroup}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => setDeleteConfirmOpen(false)}
                    stretched
                />
            </Dialog>
        </div>
    )
}
