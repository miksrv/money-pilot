import React, { useState } from 'react'
import { Button, Dialog, Input } from 'simple-react-ui-kit'

import { AppLayout } from '@/components'

export const Accounts: React.FC = () => {
    const [openTransactionDialog, setOpenTransactionDialog] = useState(false)

    return (
        <AppLayout
            actions={
                <Button
                    mode={'secondary'}
                    icon={'PlusCircle'}
                    onClick={() => setOpenTransactionDialog(true)}
                />
            }
        >
            {'Accounts'}

            <Dialog
                open={openTransactionDialog}
                onCloseDialog={() => setOpenTransactionDialog(false)}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '2rem',
                    flexDirection: 'column'
                }}
            >
                <Input
                    type={'text'}
                    size={'medium'}
                    placeholder={'Имя объекта в каталогах'}
                />

                <Button
                    style={{ width: '100%' }}
                    type={'submit'}
                    mode={'primary'}
                    label={'Создать'}
                />
            </Dialog>
        </AppLayout>
    )
}
