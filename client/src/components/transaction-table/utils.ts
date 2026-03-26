import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'

export function getDateLabel(dateStr: string, t: ReturnType<typeof useTranslation>['t']): string {
    const today = dayjs().format('YYYY-MM-DD')
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    if (dateStr === today) {
        return t('transactions.today', 'TODAY')
    }
    if (dateStr === yesterday) {
        return t('transactions.yesterday', 'YESTERDAY')
    }
    return dayjs(dateStr).format('dddd, MMMM D').toUpperCase()
}
