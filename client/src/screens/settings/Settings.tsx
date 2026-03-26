import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Container, Dialog, Input, Message, Select } from 'simple-react-ui-kit'

import {
    ApiError,
    ApiModel,
    useChangePasswordMutation,
    useCreateGroupMutation,
    useDeleteGroupMutation,
    useDeleteMyAccountMutation,
    useGetGroupInvitationsQuery,
    useGetGroupMembersQuery,
    useGetPendingInvitationsQuery,
    useGetProfileQuery,
    useInviteMemberMutation,
    useJoinGroupMutation,
    useListGroupsQuery,
    useRemoveMemberMutation,
    useRevokeInvitationMutation,
    useUpdateProfileMutation
} from '@/api'
import { AppLayout } from '@/components'
import { logout, setActiveGroup } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { formatUTCDate } from '@/utils/dates'

import styles from './styles.module.sass'

type ChangePasswordFormData = ApiModel.ChangePasswordBody & { confirm_password: string }

type InviteFormData = {
    email: string
    role: 'member' | 'viewer'
}

/* ─── Sub-component: single owned group card ─────────────────────────────── */

interface OwnedGroupCardProps {
    group: ApiModel.Group
    currentUserId: string
    onInvite: (groupId?: string) => void
}

const OwnedGroupCard: React.FC<OwnedGroupCardProps> = ({ group, currentUserId, onInvite }) => {
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

    const handleRemoveMember = async (memberId: string) => {
        try {
            await removeMember({ groupId: group.id, memberId }).unwrap()
            setRemoveConfirmId(undefined)
        } catch (err) {
            console.error('Failed to remove member:', err)
        }
    }

    const handleRevokeInvitation = async (invitationId: string) => {
        try {
            await revokeInvitation({ groupId: group.id, invitationId }).unwrap()
            setRevokeConfirmId(undefined)
        } catch (err) {
            console.error('Failed to revoke invitation:', err)
        }
    }

    const handleDeleteGroup = async () => {
        try {
            await deleteGroup(group.id).unwrap()
            dispatch(setActiveGroup(null))
            setDeleteConfirmOpen(false)
        } catch (err) {
            console.error('Failed to delete group:', err)
        }
    }

    const memberInitials = (name: string) =>
        name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()

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

/* ─── Sub-component: accessed group row ─────────────────────────────────── */

interface AccessedGroupRowProps {
    group: ApiModel.Group
    currentUserId: string
}

const AccessedGroupRow: React.FC<AccessedGroupRowProps> = ({ group, currentUserId }) => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: members } = useGetGroupMembersQuery(group.id, { skip: !isAuth })
    const [removeMember] = useRemoveMemberMutation()

    const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

    const myMember = members?.find((m) => m.user_id === currentUserId)

    const handleLeave = async () => {
        if (!myMember) {
            return
        }
        try {
            await removeMember({ groupId: group.id, memberId: myMember.id }).unwrap()
            dispatch(setActiveGroup(null))
            setLeaveConfirmOpen(false)
        } catch (err) {
            console.error('Failed to leave group:', err)
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
                onCloseDialog={() => setLeaveConfirmOpen(false)}
            >
                <Message type='warning'>
                    {t('groups.leaveConfirm', 'Leave this shared budget? You will lose access to this budget.')}
                </Message>
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

/* ─── Main Settings component ────────────────────────────────────────────── */

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth.isAuth)

    const { data: profile, isLoading: profileLoading } = useGetProfileQuery(undefined, { skip: !isAuth })
    const { data: groups } = useListGroupsQuery(undefined, { skip: !isAuth })
    const { data: pendingInvitations } = useGetPendingInvitationsQuery(undefined, { skip: !isAuth })

    const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation()
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
    const [deleteMyAccount, { isLoading: isDeletingAccount }] = useDeleteMyAccountMutation()
    const [createGroup, { isLoading: isCreatingGroup }] = useCreateGroupMutation()
    const [inviteMember, { isLoading: isSendingInvite }] = useInviteMemberMutation()
    const [joinGroup, { isLoading: isJoining }] = useJoinGroupMutation()

    const [profileSaved, setProfileSaved] = useState(false)
    const [passwordChanged, setPasswordChanged] = useState(false)
    const [profileError, setProfileError] = useState<string | undefined>()
    const [passwordError, setPasswordError] = useState<string | undefined>()

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
        (localStorage.getItem('theme') as 'light' | 'dark' | 'system') ?? 'light'
    )

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    /* Invite dialog state */
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
    const [inviteGroupId, setInviteGroupId] = useState<string | undefined>()
    const [inviteSuccess, setInviteSuccess] = useState(false)
    const [inviteError, setInviteError] = useState<string | undefined>()
    const [createGroupError, setCreateGroupError] = useState<string | undefined>()

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        reset: resetProfile,
        watch: watchProfile,
        setValue: setProfileValue,
        formState: { errors: profileErrors }
    } = useForm<ApiModel.UpdateProfileBody>()

    const {
        register: registerPwd,
        handleSubmit: handlePwdSubmit,
        watch,
        reset: resetPwd,
        formState: { errors: pwdErrors }
    } = useForm<ChangePasswordFormData>()

    const {
        register: registerInvite,
        handleSubmit: handleInviteSubmit,
        watch: watchInvite,
        reset: resetInvite,
        setValue: setInviteValue,
        formState: { errors: inviteErrors }
    } = useForm<InviteFormData>({ defaultValues: { role: 'member' } })

    const inviteEmail = watchInvite('email') ?? ''
    const inviteRole = watchInvite('role') ?? 'member'
    const newPassword = watch('new_password')

    useEffect(() => {
        document.title = `${t('page.settings', 'Settings')} — Money Pilot`
    }, [t])

    useEffect(() => {
        if (profile) {
            resetProfile({ name: profile.name, phone: profile.phone ?? '', currency: profile.currency ?? 'USD' })
        }
    }, [profile])

    const initials = profile?.name
        ? profile.name
              .split(' ')
              .map((w) => w[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()
        : '?'

    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        const resolved =
            newTheme === 'system'
                ? window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light'
                : newTheme
        document.documentElement.setAttribute('data-theme', resolved)
    }

    const applyLanguage = (lang: string) => {
        void i18n.changeLanguage(lang).then(() => {
            import('dayjs').then((dayjs) => {
                dayjs.default.locale(lang)
            })
        })
    }

    const onProfileSubmit = async (data: ApiModel.UpdateProfileBody) => {
        setProfileError(undefined)
        try {
            await updateProfile(data).unwrap()
            setProfileSaved(true)
            setTimeout(() => setProfileSaved(false), 3000)
        } catch {
            setProfileError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    const onPasswordSubmit = async (data: ChangePasswordFormData) => {
        setPasswordError(undefined)
        try {
            await changePassword({ current_password: data.current_password, new_password: data.new_password }).unwrap()
            setPasswordChanged(true)
            resetPwd()
            setTimeout(() => setPasswordChanged(false), 3000)
        } catch {
            setPasswordError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') {
            return
        }
        try {
            await deleteMyAccount().unwrap()
            dispatch(logout())
            void navigate('/login')
        } catch (err) {
            console.error('Failed to delete account:', err)
        }
    }

    /* Open invite dialog — creating group first if needed */
    const handleOpenInvite = async (groupId?: string) => {
        setInviteError(undefined)
        setInviteSuccess(false)
        setCreateGroupError(undefined)
        resetInvite({ role: 'member' })

        if (groupId) {
            setInviteGroupId(groupId)
            setInviteDialogOpen(true)
            return
        }

        const ownedGroup = groups?.find((g) => g.owner_id === profile?.id)
        if (ownedGroup) {
            setInviteGroupId(ownedGroup.id)
            setInviteDialogOpen(true)
            return
        }

        /* Create group on first invite */
        try {
            const newGroup = await createGroup({ name: `${profile?.name ?? 'My'}'s Budget` }).unwrap()
            setInviteGroupId(newGroup.id)
            setInviteDialogOpen(true)
        } catch (err) {
            console.error('Failed to create group:', err)
            setCreateGroupError(t('common.errors.unknown', 'An error occurred. Please try again.'))
        }
    }

    const onInviteSubmit = async (data: InviteFormData) => {
        if (!inviteGroupId) {
            return
        }
        setInviteError(undefined)

        try {
            await inviteMember({ groupId: inviteGroupId, body: { email: data.email, role: data.role } }).unwrap()
            setInviteSuccess(true)
            setTimeout(() => {
                setInviteDialogOpen(false)
                setInviteSuccess(false)
                resetInvite({ role: 'member' })
            }, 3000)
        } catch (err) {
            const apiErr = err as { data?: ApiError }
            const code = apiErr?.data?.messages?.error

            if (code === 'user_not_found') {
                setInviteError(t('groups.errorUserNotFound'))
            } else if (code === 'already_member') {
                setInviteError(t('groups.errorAlreadyMember'))
            } else if (code === 'invitation_pending') {
                setInviteError(t('groups.errorInvitationPending'))
            } else {
                setInviteError(t('common.errors.unknown'))
            }
        }
    }

    const handleAcceptInvitation = async (token: string) => {
        try {
            const group = await joinGroup({ token }).unwrap()
            dispatch(setActiveGroup(group.id))
        } catch (err) {
            console.error('Failed to accept invitation:', err)
        }
    }

    const profileCurrency = watchProfile('currency') ?? 'USD'

    const currencyOptions = [
        { key: 'USD', value: 'USD — US Dollar' },
        { key: 'EUR', value: 'EUR — Euro' },
        { key: 'GBP', value: 'GBP — British Pound' },
        { key: 'JPY', value: 'JPY — Japanese Yen' },
        { key: 'CAD', value: 'CAD — Canadian Dollar' },
        { key: 'AUD', value: 'AUD — Australian Dollar' },
        { key: 'CHF', value: 'CHF — Swiss Franc' },
        { key: 'CNY', value: 'CNY — Chinese Yuan' },
        { key: 'INR', value: 'INR — Indian Rupee' },
        { key: 'RUB', value: 'RUB — Russian Ruble' },
        { key: 'BRL', value: 'BRL — Brazilian Real' },
        { key: 'MXN', value: 'MXN — Mexican Peso' },
        { key: 'KRW', value: 'KRW — South Korean Won' },
        { key: 'SGD', value: 'SGD — Singapore Dollar' },
        { key: 'HKD', value: 'HKD — Hong Kong Dollar' },
        { key: 'NOK', value: 'NOK — Norwegian Krone' },
        { key: 'SEK', value: 'SEK — Swedish Krona' },
        { key: 'PLN', value: 'PLN — Polish Zloty' },
        { key: 'TRY', value: 'TRY — Turkish Lira' },
        { key: 'AED', value: 'AED — UAE Dirham' }
    ]

    const themeOptions = [
        { key: 'light', value: t('settings.preferences.themeLight', 'Light') },
        { key: 'dark', value: t('settings.preferences.themeDark', 'Dark') },
        { key: 'system', value: t('settings.preferences.themeSystem', 'System') }
    ]

    const languageOptions = [
        { key: 'en', value: 'English' },
        { key: 'ru', value: 'Русский' }
    ]

    const roleOptions = [
        { key: 'member', value: t('groups.inviteRoleMember', 'Member (full access)') },
        { key: 'viewer', value: t('groups.inviteRoleViewer', 'Viewer (read-only)') }
    ]

    const currentUserId = profile?.id ?? ''
    const ownedGroups = groups?.filter((g) => g.owner_id === currentUserId) ?? []
    const accessedGroups = groups?.filter((g) => g.owner_id !== currentUserId) ?? []
    const hasAnyGroups = (groups?.length ?? 0) > 0
    const hasPendingInvitations = (pendingInvitations?.length ?? 0) > 0

    return (
        <AppLayout>
            <div className={styles.settings}>
                {/* Profile */}
                <Container title={t('settings.profile.title', 'Profile')}>
                    {profileLoading ? null : (
                        <form
                            className={styles.profileForm}
                            onSubmit={handleProfileSubmit(onProfileSubmit)}
                        >
                            <div className={styles.avatar}>{initials}</div>

                            {profileSaved && (
                                <Message type='success'>{t('settings.profile.saved', 'Profile saved!')}</Message>
                            )}
                            {profileError && <Message type='error'>{profileError}</Message>}

                            <Input
                                id='profile-name'
                                type='text'
                                size='medium'
                                label={t('settings.profile.fullName', 'Full Name')}
                                placeholder={t('settings.profile.fullName', 'Full Name')}
                                error={profileErrors.name?.message}
                                {...registerProfile('name', {
                                    required: t('common.required', 'Required')
                                })}
                            />

                            <Input
                                id='profile-email'
                                type='email'
                                size='medium'
                                label={t('settings.profile.email', 'Email')}
                                value={profile?.email ?? ''}
                                disabled
                            />

                            <Input
                                id='profile-phone'
                                type='text'
                                size='medium'
                                label={t('settings.profile.phone', 'Phone')}
                                placeholder={t('settings.profile.phone', 'Phone')}
                                {...registerProfile('phone')}
                            />

                            <Select<string>
                                label={t('settings.profile.currency', 'Currency')}
                                options={currencyOptions}
                                value={profileCurrency}
                                onSelect={(items) => setProfileValue('currency', items?.[0]?.key ?? 'USD')}
                            />

                            <Button
                                type='submit'
                                mode='primary'
                                label={isSavingProfile ? '...' : t('settings.profile.save', 'Save Changes')}
                                disabled={isSavingProfile}
                                stretched
                            />
                        </form>
                    )}
                </Container>

                {/* Security */}
                <Container title={t('settings.security.title', 'Security')}>
                    <form
                        className={styles.passwordForm}
                        onSubmit={handlePwdSubmit(onPasswordSubmit)}
                    >
                        {passwordChanged && (
                            <Message type='success'>
                                {t('settings.security.passwordChanged', 'Password changed successfully!')}
                            </Message>
                        )}
                        {passwordError && <Message type='error'>{passwordError}</Message>}

                        <Input
                            id='current-password'
                            type='password'
                            size='medium'
                            label={t('settings.security.currentPassword', 'Current Password')}
                            placeholder={t('settings.security.currentPassword', 'Current Password')}
                            error={pwdErrors.current_password?.message}
                            {...registerPwd('current_password', {
                                required: t('common.required', 'Required')
                            })}
                        />

                        <Input
                            id='new-password'
                            type='password'
                            size='medium'
                            label={t('settings.security.newPassword', 'New Password')}
                            placeholder={t('settings.security.newPassword', 'New Password')}
                            error={pwdErrors.new_password?.message}
                            {...registerPwd('new_password', {
                                required: t('common.required', 'Required'),
                                minLength: {
                                    value: 8,
                                    message: t(
                                        'settings.security.passwordTooShort',
                                        'Password must be at least 8 characters'
                                    )
                                }
                            })}
                        />

                        <Input
                            id='confirm-password'
                            type='password'
                            size='medium'
                            label={t('settings.security.confirmPassword', 'Confirm New Password')}
                            placeholder={t('settings.security.confirmPassword', 'Confirm New Password')}
                            error={pwdErrors.confirm_password?.message}
                            {...registerPwd('confirm_password', {
                                required: t('common.required', 'Required'),
                                validate: (value) =>
                                    value === newPassword ||
                                    t('settings.security.passwordMismatch', 'Passwords do not match')
                            })}
                        />

                        <Button
                            type='submit'
                            mode='primary'
                            label={
                                isChangingPassword ? '...' : t('settings.security.changePassword', 'Change Password')
                            }
                            disabled={isChangingPassword}
                            stretched
                        />
                    </form>
                </Container>

                {/* Shared Budgets */}
                <Container title={t('groups.sharedBudgets', 'Shared Budgets')}>
                    <div className={styles.sharedBudgets}>
                        {/* Pending invitations for current user */}
                        {hasPendingInvitations && (
                            <div className={styles.sharedBudgetsSection}>
                                <div className={styles.sharedBudgetsSectionTitle}>
                                    {t('groups.pendingInvitations', 'Pending Invitations')}
                                </div>
                                {pendingInvitations!.map((inv) => (
                                    <div
                                        className={styles.pendingInvitationCard}
                                        key={inv.id}
                                    >
                                        <div className={styles.pendingInvitationInfo}>
                                            <span className={styles.pendingInvitationName}>
                                                {inv.inviter_name} — {inv.group_name}
                                            </span>
                                            <Badge
                                                label={t('groups.role.' + inv.role, inv.role)}
                                                size='small'
                                            />
                                            <span className={styles.pendingInvitationExpiry}>
                                                {t('groups.expiresAt', 'Expires {{date}}', {
                                                    date: formatUTCDate(inv.expires_at, 'DD.MM.YYYY')
                                                })}
                                            </span>
                                        </div>
                                        <Button
                                            mode='primary'
                                            label={
                                                isJoining
                                                    ? '...'
                                                    : t('groups.joinGoTo', "View {{name}}'s Budget", {
                                                          name: inv.group_name
                                                      })
                                            }
                                            disabled={isJoining}
                                            onClick={() => handleAcceptInvitation(inv.token)}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Budgets you own */}
                        {ownedGroups.length > 0 && (
                            <div className={styles.sharedBudgetsSection}>
                                <div className={styles.sharedBudgetsSectionTitle}>
                                    {t('groups.budgetsYouShare', 'Budgets You Share')}
                                </div>
                                {ownedGroups.map((group) => (
                                    <OwnedGroupCard
                                        key={group.id}
                                        group={group}
                                        currentUserId={currentUserId}
                                        onInvite={handleOpenInvite}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Budgets you have access to */}
                        {accessedGroups.length > 0 && (
                            <div className={styles.sharedBudgetsSection}>
                                <div className={styles.sharedBudgetsSectionTitle}>
                                    {t('groups.budgetsYouAccess', 'Budgets You Have Access To')}
                                </div>
                                {accessedGroups.map((group) => (
                                    <AccessedGroupRow
                                        key={group.id}
                                        group={group}
                                        currentUserId={currentUserId}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Empty state */}
                        {!hasAnyGroups && !hasPendingInvitations && (
                            <Message type='info'>
                                {t('groups.noSharedBudgets', "You haven't shared your budget with anyone yet.")}
                            </Message>
                        )}

                        {/* Group creation error */}
                        {createGroupError && <Message type='error'>{createGroupError}</Message>}

                        {/* Share My Budget button */}
                        <Button
                            mode='secondary'
                            icon='PlusCircle'
                            label={isCreatingGroup ? '...' : t('groups.shareMyBudget', 'Share My Budget')}
                            disabled={isCreatingGroup || !profile}
                            onClick={() => void handleOpenInvite()}
                        />
                    </div>
                </Container>

                {/* Preferences */}
                <Container title={t('settings.preferences.title', 'Preferences')}>
                    <div className={styles.prefRow}>
                        <label>{t('settings.preferences.theme', 'Theme')}</label>
                        <Select<string>
                            options={themeOptions}
                            value={theme}
                            onSelect={(items) => {
                                const key = items?.[0]?.key
                                if (key) {
                                    applyTheme(key as 'light' | 'dark' | 'system')
                                }
                            }}
                        />
                    </div>
                    <div className={styles.prefRow}>
                        <label>{t('settings.preferences.language', 'Language')}</label>
                        <Select<string>
                            options={languageOptions}
                            value={i18n.language}
                            onSelect={(items) => {
                                const key = items?.[0]?.key
                                if (key) {
                                    applyLanguage(key)
                                }
                            }}
                        />
                    </div>
                </Container>

                {/* Danger Zone */}
                <Container title={t('settings.dangerZone.title', 'Danger Zone')}>
                    <div className={styles.dangerZone}>
                        <Button
                            mode='outline'
                            variant='negative'
                            label={t('settings.dangerZone.deleteAccount', 'Delete My Account')}
                            onClick={() => setDeleteDialogOpen(true)}
                        />
                    </div>
                </Container>
            </div>

            {/* Delete account dialog */}
            <Dialog
                open={deleteDialogOpen}
                title={t('settings.dangerZone.deleteConfirmTitle', 'Delete your account?')}
                onCloseDialog={() => {
                    setDeleteDialogOpen(false)
                    setDeleteConfirmText('')
                }}
            >
                <Message type='error'>
                    {t(
                        'settings.dangerZone.deleteConfirmBody',
                        'This will permanently delete your account and all associated data. This action cannot be undone.'
                    )}
                </Message>
                <Input
                    id='delete-confirm'
                    type='text'
                    size='medium'
                    label={t('settings.dangerZone.typeToConfirm', 'Type DELETE to confirm')}
                    placeholder='DELETE'
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                />
                <Button
                    mode='primary'
                    variant='negative'
                    label={isDeletingAccount ? '...' : t('settings.dangerZone.delete', 'Permanently Delete Account')}
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                    stretched
                />
                <Button
                    mode='outline'
                    label={t('common.cancel', 'Cancel')}
                    onClick={() => {
                        setDeleteDialogOpen(false)
                        setDeleteConfirmText('')
                    }}
                    stretched
                />
            </Dialog>

            {/* Invite dialog */}
            <Dialog
                open={inviteDialogOpen}
                title={t('groups.inviteTitle', 'Invite Someone to View Your Budget')}
                onCloseDialog={() => {
                    setInviteDialogOpen(false)
                    setInviteSuccess(false)
                    setInviteError(undefined)
                    resetInvite({ role: 'member' })
                }}
            >
                {inviteSuccess ? (
                    <Message type='success'>{t('groups.inviteSent', 'Invitation sent!')}</Message>
                ) : (
                    <form onSubmit={handleInviteSubmit(onInviteSubmit)}>
                        <div className={styles.inviteForm}>
                            <Input
                                id='invite-email'
                                type='email'
                                size='medium'
                                label={t('groups.inviteEmail', 'Email Address')}
                                placeholder='email@example.com'
                                error={inviteErrors.email?.message}
                                {...registerInvite('email', {
                                    required: t('common.required', 'Required')
                                })}
                            />

                            <Select<string>
                                label={t('groups.inviteRole', 'Access Level')}
                                options={roleOptions}
                                value={inviteRole}
                                onSelect={(items) =>
                                    setInviteValue('role', (items?.[0]?.key ?? 'member') as 'member' | 'viewer')
                                }
                            />

                            <Message type='warning'>
                                {t(
                                    'groups.inviteWarning',
                                    'Once {{email}} accepts this invitation, they will have complete visibility into ALL of your accounts and ALL of your transactions, including all historical data.',
                                    { email: inviteEmail || '...' }
                                )}
                            </Message>

                            {inviteError && inviteError === t('groups.errorInvitationPending') && (
                                <Message type='warning'>{inviteError}</Message>
                            )}
                            {inviteError && inviteError !== t('groups.errorInvitationPending') && (
                                <Message type='error'>{inviteError}</Message>
                            )}

                            <Button
                                type='submit'
                                mode='primary'
                                label={isSendingInvite ? '...' : t('groups.sendInvitation', 'Send Invitation')}
                                disabled={isSendingInvite}
                                stretched
                            />
                            <Button
                                mode='outline'
                                label={t('common.cancel', 'Cancel')}
                                onClick={() => {
                                    setInviteDialogOpen(false)
                                    setInviteError(undefined)
                                    resetInvite({ role: 'member' })
                                }}
                                stretched
                            />
                        </div>
                    </form>
                )}
            </Dialog>
        </AppLayout>
    )
}
