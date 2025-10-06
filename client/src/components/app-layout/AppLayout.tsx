import React, { PropsWithChildren } from 'react'
import { cn } from 'simple-react-ui-kit'

import { AppBar, AppBarProps } from '../app-bar'

import Menu from './Menu'

import styles from './styles.module.sass'

export interface AppLayoutProps extends PropsWithChildren<AppBarProps> {
    size?: 'small' | 'medium' | 'large'
}

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
    return (
        <div className={styles.appLayout}>
            <aside className={cn(styles.sidebar)}>
                <Menu />
            </aside>

            <main className={styles.main}>
                <AppBar actions={props.actions} />

                <div className={styles.content}>{props.children}</div>
            </main>
        </div>
    )
}
