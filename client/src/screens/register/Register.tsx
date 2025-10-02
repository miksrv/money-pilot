import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Input } from 'simple-react-ui-kit'

import { ApiError, useRegistrationMutation } from '@/api'
import { login } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'

import styles from './styles.module.sass'

const MIN_PASSWORD_LENGTH = 6

type RegisterFormData = {
    email: string
    password: string
}

export const Register: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

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
            // await navigate('/dashboard')
        } catch (err) {
            console.error('Login failed:', err)
        }
    }

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
                    message: errorData.messages?.error || t('register.error')
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
        <div className={styles.container}>
            <Container>
                <h2>{t('register.title', 'Регистрация')}</h2>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <Input
                        type={'email'}
                        label={t('register.input_email_title', 'Email')}
                        placeholder={t('register.input_email_placeholder', 'Введите email')}
                        error={errors.email?.message}
                        {...register('email', {
                            required: t('register.input_email_required_error', 'Email is required'),
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: t('register.input_email_invalid_error', 'Invalid email address')
                            }
                        })}
                    />

                    <Input
                        type={'password'}
                        label={t('register.input_password_title', 'Пароль')}
                        placeholder={t('register.input_password_placeholder', 'Введите пароль')}
                        error={errors.password?.message}
                        {...register('password', {
                            required: t('register.input_password_required_error', 'Pasword is required'),
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

                    <Button
                        type={'submit'}
                        mode={'primary'}
                        label={t('register.button_register', 'Зарегистрироваться')}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                </form>
            </Container>
        </div>
    )
}
