import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router-dom'
import { cn, Icon, IconTypes } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export type MenuItemType = {
    icon?: IconTypes
    link?: string
    text: string
}

interface MenuProps {
    onClick?: () => void
    collapsed?: boolean
}

const Menu: React.FC<MenuProps> = ({ onClick, collapsed }) => {
    const { t } = useTranslation()
    const location = useLocation()

    const mainItems: MenuItemType[] = [
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
            link: '/recurring',
            text: t('menu.recurring', 'Recurring')
        },
        {
            icon: 'Pressure',
            link: '/payees',
            text: t('menu.payees', 'Payees')
        },
        {
            icon: 'Chart',
            link: '/reports',
            text: t('menu.reports', 'Reports')
        }
    ]

    const bottomItems: MenuItemType[] = [
        {
            icon: 'Settings',
            link: '/settings',
            text: t('menu.settings', 'Settings')
        }
    ]

    return (
        <div className={cn(styles.menuWrapper, collapsed && styles.collapsed)}>
            <menu className={styles.menu}>
                {mainItems
                    .filter(({ link }) => !!link)
                    .map((item, i) => (
                        <li key={`menu${i}`}>
                            <Link
                                to={item.link!}
                                title={item.text}
                                className={cn(location.pathname === item.link && styles.active)}
                                onClick={() => onClick?.()}
                            >
                                {item.icon && <Icon name={item.icon} />}
                                <span className={styles.label}>{item.text}</span>
                            </Link>
                        </li>
                    ))}
            </menu>

            <menu className={cn(styles.menu, styles.menuBottom)}>
                {bottomItems.map((item, i) => (
                    <li key={`menuBottom${i}`}>
                        <Link
                            to={item.link!}
                            title={item.text}
                            className={cn(location.pathname === item.link && styles.active)}
                            onClick={() => onClick?.()}
                        >
                            {item.icon && <Icon name={item.icon} />}
                            <span className={styles.label}>{item.text}</span>
                        </Link>
                    </li>
                ))}
            </menu>
        </div>
    )
}

export default Menu
