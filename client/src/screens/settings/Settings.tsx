import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Dialog, Input, Message, Select } from 'simple-react-ui-kit'

import {
    ApiModel,
    useChangePasswordMutation,
    useDeleteMyAccountMutation,
    useGetProfileQuery,
    useUpdateProfileMutation
} from '@/api'
import { AppLayout } from '@/components'
import { logout } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

type ChangePasswordFormData = ApiModel.ChangePasswordBody & { confirm_password: string }

export const Settings: React.FC = () => {
    const { t, i18n } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const isAuth = useAppSelector((state) => state.auth)

    const { data: profile, isLoading: profileLoading } = useGetProfileQuery(undefined, { skip: !isAuth })

    const [updateProfile, { isLoading: isSavingProfile }] = useUpdateProfileMutation()
    const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation()
    const [deleteMyAccount, { isLoading: isDeletingAccount }] = useDeleteMyAccountMutation()

    const [profileSaved, setProfileSaved] = useState(false)
    const [passwordChanged, setPasswordChanged] = useState(false)
    const [profileError, setProfileError] = useState<string | undefined>()
    const [passwordError, setPasswordError] = useState<string | undefined>()

    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
        (localStorage.getItem('theme') as 'light' | 'dark' | 'system') ?? 'light'
    )

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [deleteConfirmText, setDeleteConfirmText] = useState('')

    const {
        register: registerProfile,
        handleSubmit: handleProfileSubmit,
        reset: resetProfile,
        formState: { errors: profileErrors }
    } = useForm<ApiModel.UpdateProfileBody>()

    const {
        register: registerPwd,
        handleSubmit: handlePwdSubmit,
        watch,
        reset: resetPwd,
        formState: { errors: pwdErrors }
    } = useForm<ChangePasswordFormData>()

    const newPassword = watch('new_password')

    useEffect(() => {
        if (profile) {
            resetProfile({ name: profile.name, phone: profile.phone ?? '' })
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
        void i18n.changeLanguage(lang)
        localStorage.setItem('i18nextLng', lang)
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

    const themeOptions = [
        { key: 'light', value: t('settings.preferences.themeLight', 'Light') },
        { key: 'dark', value: t('settings.preferences.themeDark', 'Dark') },
        { key: 'system', value: t('settings.preferences.themeSystem', 'System') }
    ]

    const languageOptions = [
        { key: 'en', value: 'English' },
        { key: 'ru', value: 'Русский' }
    ]

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

                {/* Preferences */}
                <Container title={t('settings.preferences.title', 'Preferences')}>
                    <div className={styles.prefRow}>
                        <label>{t('settings.preferences.theme', 'Theme')}</label>
                        <Select<string>
                            options={themeOptions}
                            value={theme}
                            onSelect={(items) =>
                                applyTheme((items?.[0]?.key ?? 'light') as 'light' | 'dark' | 'system')
                            }
                        />
                    </div>
                    <div className={styles.prefRow}>
                        <label>{t('settings.preferences.language', 'Language')}</label>
                        <Select<string>
                            options={languageOptions}
                            value={i18n.language}
                            onSelect={(items) => applyLanguage(items?.[0]?.key ?? 'en')}
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
        </AppLayout>
    )
}
