import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Message } from 'simple-react-ui-kit'

import { ApiError, useLoginMutation } from '@/api'
import { login } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'
import { LocalStorage } from '@/utils/localStorage'

import { MIN_PASSWORD_LENGTH, SAVED_EMAIL_KEY } from './constants'

import styles from './styles.module.sass'

type LoginFormData = {
    email: string
    password: string
}

export const Login: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const [showPassword, setShowPassword] = useState<boolean>(false)

    const savedEmail = LocalStorage.getItem<string>(SAVED_EMAIL_KEY)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<LoginFormData>({
        defaultValues: {
            email: savedEmail ?? ''
        }
    })

    const [loginMutation, { isLoading, error: apiError, data: apiData }] = useLoginMutation()
    const [submittedEmail, setSubmittedEmail] = useState<string>('')

    const onSubmit = async (data: LoginFormData) => {
        setSubmittedEmail(data.email)
        await loginMutation({ email: data.email, password: data.password })
    }

    useEffect(() => {
        document.title = 'Sign In — Money Pilot'
    }, [])

    useEffect(() => {
        if (apiError) {
            const errorData = apiError as ApiError
            if (errorData.messages) {
                Object.keys(errorData.messages).forEach((field) => {
                    setError(field as keyof LoginFormData, {
                        type: 'server',
                        message: errorData.messages[field]
                    })
                })
            } else {
                setError('root', {
                    type: 'server',
                    message: t('register.error')
                })
            }
        }
    }, [apiError, setError, t])

    useEffect(() => {
        if (apiData?.token?.length) {
            LocalStorage.setItem(SAVED_EMAIL_KEY, submittedEmail)
            dispatch(login(apiData.token))
            void navigate('/')
        }
    }, [apiData])

    return (
        <div className={styles.page}>
            <div className={styles.brand}>
                <div className={styles.brandLogo}>
                    <span className={styles.brandIcon}>✈</span>
                    <span className={styles.brandName}>Money Pilot</span>
                </div>
                <p className={styles.brandTagline}>{'Your finances,\nbeautifully organized.'}</p>
                <p className={styles.brandSubtext}>{'Track spending, set budgets,\nand reach your financial goals.'}</p>
            </div>

            <div className={styles.formPanel}>
                <div className={styles.card}>
                    <h1 className={styles.cardTitle}>{t('login.title', 'Welcome back')}</h1>
                    <p className={styles.cardSubtitle}>{t('login.subtitle', 'Sign in to your account')}</p>

                    <form
                        className={styles.form}
                        onSubmit={handleSubmit(onSubmit)}
                    >
                        {errors.root && <Message type='error'>{errors.root.message}</Message>}

                        <Input
                            type='email'
                            label={t('register.input_email_title', 'Email')}
                            placeholder={t('register.input_email_placeholder', 'your@email.com')}
                            error={errors.email?.message}
                            {...register('email', {
                                required: t('register.input_email_required_error', 'Email is required'),
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: t('register.input_email_invalid_error', 'Invalid email address')
                                }
                            })}
                        />

                        <div className={styles.passwordWrapper}>
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                label={t('register.input_password_title', 'Password')}
                                placeholder={t('register.input_password_placeholder', 'Enter your password')}
                                error={errors.password?.message}
                                {...register('password', {
                                    required: t('register.input_password_required_error', 'Password is required'),
                                    minLength: {
                                        value: MIN_PASSWORD_LENGTH,
                                        message: t(
                                            'register.input_password_min_length',
                                            'Password must be at least {{length}} characters long',
                                            { length: MIN_PASSWORD_LENGTH }
                                        )
                                    }
                                })}
                            />
                            <button
                                type='button'
                                className={styles.passwordToggle}
                                onClick={() => setShowPassword((prev) => !prev)}
                            >
                                {showPassword ? t('login.password_hide', 'Hide') : t('login.password_show', 'Show')}
                            </button>
                        </div>

                        <Button
                            type='submit'
                            mode='primary'
                            stretched
                            label={isLoading ? t('common.loading', 'Loading...') : t('login.submit', 'Sign in')}
                            disabled={isLoading}
                            loading={isLoading}
                        />
                    </form>

                    <div className={styles.footer}>
                        {t('login.no_account', 'New to Money Pilot?')}{' '}
                        <Link
                            to='/register'
                            className={styles.link}
                        >
                            {t('login.create_account', 'Create account')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
