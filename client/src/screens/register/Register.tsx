import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Input, Message } from 'simple-react-ui-kit'

import { ApiError, useRegistrationMutation } from '@/api'
import { login } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'

import { MIN_PASSWORD_LENGTH } from './constants'

import styles from './styles.module.sass'

type RegisterFormData = {
    email: string
    password: string
}

export const Register: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const [showPassword, setShowPassword] = useState<boolean>(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<RegisterFormData>()

    const [registerMutation, { isLoading, error: apiError, data: apiData }] = useRegistrationMutation()

    const onSubmit = async (data: RegisterFormData) => {
        try {
            await registerMutation({ email: data.email, password: data.password })
            await navigate('/')
        } catch (err) {
            console.error('Registration failed:', err)
        }
    }

    useEffect(() => {
        document.title = 'Create Account — Money Pilot'
    }, [])

    useEffect(() => {
        if (apiError) {
            const errorData = apiError as ApiError
            if (errorData.messages) {
                Object.keys(errorData.messages).forEach((field) => {
                    setError(field as keyof RegisterFormData, {
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
        if (apiData?.token) {
            dispatch(login(apiData.token))
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
                    <h1 className={styles.cardTitle}>{t('register.title_new', 'Create your account')}</h1>
                    <p className={styles.cardSubtitle}>
                        {t('register.subtitle', 'Start managing your finances today')}
                    </p>

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
                            label={
                                isLoading
                                    ? t('common.loading', 'Loading...')
                                    : t('register.button_register', 'Create account')
                            }
                            disabled={isLoading}
                            loading={isLoading}
                        />
                    </form>

                    <div className={styles.footer}>
                        {t('register.has_account', 'Already have an account?')}{' '}
                        <Link
                            to='/login'
                            className={styles.link}
                        >
                            {t('register.sign_in', 'Sign in')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
