import dayjs, { Dayjs } from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(duration)
dayjs.extend(relativeTime)
dayjs.extend(timezone)

export const TIME_ZONE = 'Asia/Yekaterinburg'
export const DEFAULT_SHORT_DATE_FORMAT = 'DD.MM.YYYY, HH:mm'
export const DEFAULT_FULL_DATE_FORMAT = 'D MMMM YYYY, HH:mm'

/**
 * Format date to the specified format
 * @param date
 * @param format
 */
export const formatDate = (date?: string | Date | Dayjs, format?: string): string | undefined =>
    date ? dayjs(date).format(format ?? DEFAULT_SHORT_DATE_FORMAT) : undefined

/**
 * Format date to the specified format in UTC timezone
 * @param date
 * @param format
 */
export const formatUTCDate = (date?: string | Date, format: string = DEFAULT_FULL_DATE_FORMAT): string | undefined =>
    date ? dayjs.utc(date).tz(TIME_ZONE).format(format) : undefined

/**
 * Format date from unix timestamp in milliseconds to the specified format in UTC timezone
 * @param timestamp
 * @param format
 */
export const formatDateFromUnixUTC = (timestamp?: number, format: string = DEFAULT_FULL_DATE_FORMAT): string =>
    timestamp
        ? dayjs
              .unix(timestamp / 1000)
              .utc(true)
              .tz(TIME_ZONE)
              .format(format)
        : ''

/**
 * Get seconds until the specified UTC date
 * @param date
 */
export const getSecondsUntilUTCDate = (date?: string | Date): number | undefined =>
    date ? dayjs.utc(date).tz(TIME_ZONE).diff(dayjs(), 'second') : undefined
dayjs.extend(duration)

/**
 * Get date time format based on the difference between start and end dates
 * @param startDate
 * @param endDate
 * @param enLocale
 */
export const getDateTimeFormat = (startDate?: string, endDate?: string, enLocale?: boolean): string => {
    const start = dayjs(startDate)
    const end = dayjs(endDate)

    const diffInDays = end.diff(start, 'day')

    if (diffInDays <= 1) {
        // If the difference is 1 day or less, format by hours and minutes
        return enLocale ? 'h:mm a' : 'HH:mm'
    } else if (diffInDays > 1 && diffInDays <= 7) {
        // If the difference is greater than 1 day but less than or equal to 7 days, format by date and hour
        return enLocale ? 'D MMM h:00 a' : 'D MMM HH:00'
    }

    // If the difference is more than 7 days, format by days
    return 'D MMMM'
}
