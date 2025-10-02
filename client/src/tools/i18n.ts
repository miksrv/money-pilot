import { initReactI18next } from 'react-i18next'
import dayjs from 'dayjs'
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import Backend from 'i18next-http-backend'

import 'dayjs/locale/ru'

void i18n
    .use(Backend)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        keySeparator: '.',
        fallbackLng: 'en-US',
        debug: false,
        backend: {
            loadPath: '/locales/{{lng}}/translation.json'
        },
        supportedLngs: ['en-US', 'ru-RU'],
        interpolation: {
            escapeValue: false
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage']
        }
    })
    .then(() => {
        dayjs.locale(i18n.language)
    })

export default i18n
