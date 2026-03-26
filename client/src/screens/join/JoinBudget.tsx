import React, { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Container, Message, Skeleton } from 'simple-react-ui-kit'

import { ApiError, useJoinGroupMutation } from '@/api'
import { setActiveGroup } from '@/store/authSlice'
import { useAppDispatch, useAppSelector } from '@/store/hooks'

import styles from './styles.module.sass'

export const JoinBudget: React.FC = () => {
    const { t } = useTranslation()
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const dispatch = useAppDispatch()

    const authState = useAppSelector((state) => state.auth)
    const hasJoined = useRef(false)

    const [joinGroup, { isLoading }] = useJoinGroupMutation()

    const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string; owner_name: string } | undefined>()
    const [errorKey, setErrorKey] = useState<string | undefined>()

    useEffect(() => {
        if (!authState.token) {
            void navigate('/login?redirect=/join/' + (token ?? ''))
            return
        }

        if (!authState.isAuth || !token || hasJoined.current) {
            return
        }

        hasJoined.current = true

        joinGroup({ token })
            .unwrap()
            .then((group) => {
                setJoinedGroup({ id: group.id, name: group.name, owner_name: group.owner_name })
            })
            .catch((err: unknown) => {
                const apiErr = err as { data?: ApiError }
                const code = apiErr?.data?.messages?.error

                if (code === 'token_expired') {
                    setErrorKey('groups.errorTokenExpired')
                } else if (code === 'token_not_for_you') {
                    setErrorKey('groups.errorTokenNotForYou')
                } else {
                    setErrorKey('groups.errorInvalidToken')
                }
            })
    }, [authState.isAuth, authState.token, token])

    return (
        <div className={styles.joinPage}>
            <Container title={t('groups.joinTitle', 'Join Shared Budget')}>
                {isLoading && <Skeleton style={{ height: '80px', width: '100%' }} />}

                {!isLoading && joinedGroup && (
                    <div className={styles.joinSuccess}>
                        <Message type='success'>
                            {t('groups.joinSuccess', "You now have access to {{name}}'s Budget.", {
                                name: joinedGroup.owner_name
                            })}
                        </Message>
                        <div className={styles.joinActions}>
                            <Button
                                mode='primary'
                                label={t('groups.joinGoTo', "View {{name}}'s Budget", { name: joinedGroup.owner_name })}
                                onClick={() => {
                                    dispatch(setActiveGroup(joinedGroup.id))
                                    void navigate('/')
                                }}
                            />
                            <Button
                                mode='outline'
                                label={t('groups.joinGoToMine', 'Go to My Budget')}
                                onClick={() => void navigate('/')}
                            />
                        </div>
                    </div>
                )}

                {!isLoading && errorKey && (
                    <div className={styles.joinError}>
                        <Message type='error'>{t(errorKey)}</Message>
                        <Button
                            mode='outline'
                            label={t('groups.joinGoToMine', 'Go to My Budget')}
                            onClick={() => void navigate('/')}
                        />
                    </div>
                )}
            </Container>
        </div>
    )
}
