import React from 'react'
import { cn } from 'simple-react-ui-kit'

import styles from './styles.module.sass'

export interface ProgressProps {
    value?: number
    className?: string
}

export const Progress: React.FC<ProgressProps> = ({ value, className }) => (
    <div className={cn(styles.progress, className)}>
        <div
            className={styles.line}
            style={{ width: `${value}%` }}
        />
    </div>
)
