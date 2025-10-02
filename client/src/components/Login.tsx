import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button, Container, Input } from 'simple-react-ui-kit'

import { ApiError, useLoginMutation } from '@/api'
import { login } from '@/store/authSlice'
import { useAppDispatch } from '@/store/hooks'

const MIN_PASSWORD_LENGTH = 6

type LoginFormData = {
    email: string
    password: string
}

export const LoginForm: React.FC = () => {
    const { t } = useTranslation()
    const dispatch = useAppDispatch()
    const navigate = useNavigate()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setError
    } = useForm<LoginFormData>()

    const [registerMutation, { isLoading, error: apiError, data: apiData }] = useLoginMutation()

    const onSubmit = async (data: LoginFormData) => {
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
                    setError(field as keyof LoginFormData, {
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
        <div style={{ margin: '0 auto', maxWidth: 400 }}>
            <Container>
                <h2>{t('register.title', 'Авторизация')}</h2>

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

                    <Button
                        type={'submit'}
                        mode={'primary'}
                        label={t('register.button_register', 'Войти')}
                        disabled={isLoading}
                        loading={isLoading}
                    />
                </form>
            </Container>
        </div>
    )
}
