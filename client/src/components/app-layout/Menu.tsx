import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
import { cn, Icon, IconTypes } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export type MenuItemType = {
    icon?: IconTypes
    link?: string
    text: string
}

interface MenuProps {
    onClick?: () => void
}

const Menu: React.FC<MenuProps> = ({ onClick }) => {
    const { t } = useTranslation()
    const location = useLocation()

    const menuItems: MenuItemType[] = [
        {
            icon: 'Cloud',
            link: '/',
            text: t('menu.dashboard', 'Dashboard')
        },
        {
            icon: 'Pressure',
            link: '/transactions',
            text: t('menu.transactions', 'Transactions')
        },
        {
            icon: 'Chart',
            link: '/categories',
            text: t('menu.categories', 'Categories')
        },
        {
            icon: 'Time',
            link: '/accounts',
            text: t('menu.accounts', 'Accounts')
        },
        {
            icon: 'BarChart',
            link: '/reccuring',
            text: t('menu.reccuring', 'Reccuring')
        }
    ]

    return (
        <menu className={styles.menu}>
            {menuItems
                .filter(({ link }) => !!link)
                .map((item, i) => (
                    <li key={`menu${i}`}>
                        <a
                            href={item.link!}
                            title={item.text}
                            className={cn(location.pathname === item.link && styles.active)}
                            onClick={() => onClick?.()}
                        >
                            {item.icon && <Icon name={item.icon} />}
                            {item.text}
                        </a>
                    </li>
                ))}
        </menu>
    )
}

export default Menu
