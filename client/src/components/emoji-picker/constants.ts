export type EmojiCategory =
    | 'recent'
    | 'smileys'
    | 'people'
    | 'animals'
    | 'food'
    | 'travel'
    | 'objects'
    | 'symbols'
    | 'flags'

export interface EmojiData {
    emoji: string
    keywords: {
        en: string[]
        ru: string[]
    }
    category: EmojiCategory
}

export const CATEGORY_ICONS: Record<EmojiCategory, string> = {
    recent: '🕐',
    smileys: '😀',
    people: '👋',
    animals: '🐱',
    food: '🍔',
    travel: '✈️',
    objects: '💡',
    symbols: '❤️',
    flags: '🏳️'
}

export const CATEGORY_LABELS: Record<EmojiCategory, { en: string; ru: string }> = {
    recent: { en: 'Recent', ru: 'Недавние' },
    smileys: { en: 'Smileys', ru: 'Смайлики' },
    people: { en: 'People', ru: 'Люди' },
    animals: { en: 'Animals', ru: 'Животные' },
    food: { en: 'Food', ru: 'Еда' },
    travel: { en: 'Travel', ru: 'Путешествия' },
    objects: { en: 'Objects', ru: 'Объекты' },
    symbols: { en: 'Symbols', ru: 'Символы' },
    flags: { en: 'Flags', ru: 'Флаги' }
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
    'recent',
    'smileys',
    'people',
    'animals',
    'food',
    'travel',
    'objects',
    'symbols',
    'flags'
]

// Curated emoji list with multilingual keywords for finance app
export const EMOJI_DATA: EmojiData[] = [
    // Smileys
    {
        emoji: '😀',
        keywords: { en: ['smile', 'happy', 'grin'], ru: ['улыбка', 'счастливый', 'радость'] },
        category: 'smileys'
    },
    { emoji: '😃', keywords: { en: ['smile', 'happy', 'joy'], ru: ['улыбка', 'радость'] }, category: 'smileys' },
    { emoji: '😄', keywords: { en: ['laugh', 'happy'], ru: ['смех', 'счастье'] }, category: 'smileys' },
    { emoji: '😊', keywords: { en: ['blush', 'smile', 'happy'], ru: ['румянец', 'улыбка'] }, category: 'smileys' },
    { emoji: '😎', keywords: { en: ['cool', 'sunglasses'], ru: ['крутой', 'очки'] }, category: 'smileys' },
    {
        emoji: '🤑',
        keywords: { en: ['money', 'rich', 'dollar'], ru: ['деньги', 'богатый', 'доллар'] },
        category: 'smileys'
    },
    {
        emoji: '😢',
        keywords: { en: ['sad', 'cry', 'tear'], ru: ['грустный', 'плакать', 'слеза'] },
        category: 'smileys'
    },
    {
        emoji: '😭',
        keywords: { en: ['cry', 'sob', 'sad'], ru: ['плакать', 'рыдать', 'грустный'] },
        category: 'smileys'
    },
    { emoji: '😤', keywords: { en: ['angry', 'frustrated'], ru: ['злой', 'раздраженный'] }, category: 'smileys' },
    {
        emoji: '🤔',
        keywords: { en: ['think', 'hmm', 'consider'], ru: ['думать', 'хмм', 'размышлять'] },
        category: 'smileys'
    },

    // People & Gestures
    { emoji: '👋', keywords: { en: ['wave', 'hello', 'bye'], ru: ['привет', 'пока', 'махать'] }, category: 'people' },
    {
        emoji: '👍',
        keywords: { en: ['thumbs up', 'yes', 'ok', 'approve'], ru: ['палец вверх', 'да', 'хорошо', 'одобрить'] },
        category: 'people'
    },
    {
        emoji: '👎',
        keywords: { en: ['thumbs down', 'no', 'bad'], ru: ['палец вниз', 'нет', 'плохо'] },
        category: 'people'
    },
    {
        emoji: '👏',
        keywords: { en: ['clap', 'applause', 'bravo'], ru: ['хлопать', 'аплодисменты', 'браво'] },
        category: 'people'
    },
    {
        emoji: '🙏',
        keywords: { en: ['pray', 'please', 'thank'], ru: ['молиться', 'пожалуйста', 'спасибо'] },
        category: 'people'
    },
    {
        emoji: '💪',
        keywords: { en: ['strong', 'muscle', 'power'], ru: ['сильный', 'мышца', 'сила'] },
        category: 'people'
    },
    {
        emoji: '🤝',
        keywords: { en: ['handshake', 'deal', 'agreement'], ru: ['рукопожатие', 'сделка', 'соглашение'] },
        category: 'people'
    },
    {
        emoji: '👨‍💼',
        keywords: { en: ['businessman', 'office', 'work'], ru: ['бизнесмен', 'офис', 'работа'] },
        category: 'people'
    },
    {
        emoji: '👩‍💼',
        keywords: { en: ['businesswoman', 'office', 'work'], ru: ['бизнесвумен', 'офис', 'работа'] },
        category: 'people'
    },
    {
        emoji: '👨‍💻',
        keywords: { en: ['developer', 'programmer', 'tech'], ru: ['разработчик', 'программист', 'технологии'] },
        category: 'people'
    },

    // Animals
    { emoji: '🐱', keywords: { en: ['cat', 'pet', 'kitten'], ru: ['кот', 'питомец', 'котенок'] }, category: 'animals' },
    { emoji: '🐶', keywords: { en: ['dog', 'pet', 'puppy'], ru: ['собака', 'питомец', 'щенок'] }, category: 'animals' },
    {
        emoji: '🐷',
        keywords: { en: ['pig', 'piggy', 'bank'], ru: ['свинья', 'копилка', 'хрюшка'] },
        category: 'animals'
    },
    { emoji: '🐮', keywords: { en: ['cow', 'bull', 'market'], ru: ['корова', 'бык', 'рынок'] }, category: 'animals' },
    {
        emoji: '🦁',
        keywords: { en: ['lion', 'king', 'strong'], ru: ['лев', 'король', 'сильный'] },
        category: 'animals'
    },
    {
        emoji: '🐻',
        keywords: { en: ['bear', 'market', 'stock'], ru: ['медведь', 'рынок', 'акции'] },
        category: 'animals'
    },
    { emoji: '🦊', keywords: { en: ['fox', 'clever', 'smart'], ru: ['лиса', 'хитрый', 'умный'] }, category: 'animals' },
    {
        emoji: '🐦',
        keywords: { en: ['bird', 'twitter', 'fly'], ru: ['птица', 'твиттер', 'летать'] },
        category: 'animals'
    },

    // Food & Drink
    {
        emoji: '🍔',
        keywords: { en: ['burger', 'fast food', 'meal'], ru: ['бургер', 'фастфуд', 'еда'] },
        category: 'food'
    },
    {
        emoji: '🍕',
        keywords: { en: ['pizza', 'food', 'italian'], ru: ['пицца', 'еда', 'итальянская'] },
        category: 'food'
    },
    {
        emoji: '🍽️',
        keywords: { en: ['restaurant', 'dining', 'food'], ru: ['ресторан', 'обед', 'еда'] },
        category: 'food'
    },
    { emoji: '☕', keywords: { en: ['coffee', 'cafe', 'morning'], ru: ['кофе', 'кафе', 'утро'] }, category: 'food' },
    { emoji: '🍺', keywords: { en: ['beer', 'bar', 'drink'], ru: ['пиво', 'бар', 'напиток'] }, category: 'food' },
    {
        emoji: '🍷',
        keywords: { en: ['wine', 'drink', 'alcohol'], ru: ['вино', 'напиток', 'алкоголь'] },
        category: 'food'
    },
    {
        emoji: '🛒',
        keywords: { en: ['cart', 'shopping', 'grocery', 'store'], ru: ['корзина', 'покупки', 'продукты', 'магазин'] },
        category: 'food'
    },
    { emoji: '🧾', keywords: { en: ['receipt', 'bill', 'check'], ru: ['чек', 'счет', 'квитанция'] }, category: 'food' },

    // Travel & Transport
    {
        emoji: '✈️',
        keywords: { en: ['plane', 'flight', 'travel', 'airplane'], ru: ['самолет', 'полет', 'путешествие'] },
        category: 'travel'
    },
    {
        emoji: '🚗',
        keywords: { en: ['car', 'auto', 'drive', 'vehicle'], ru: ['машина', 'авто', 'ехать', 'транспорт'] },
        category: 'travel'
    },
    { emoji: '🚕', keywords: { en: ['taxi', 'cab', 'uber'], ru: ['такси', 'кэб', 'убер'] }, category: 'travel' },
    {
        emoji: '🚌',
        keywords: { en: ['bus', 'transit', 'public'], ru: ['автобус', 'транспорт', 'общественный'] },
        category: 'travel'
    },
    {
        emoji: '🚇',
        keywords: { en: ['metro', 'subway', 'train'], ru: ['метро', 'подземка', 'поезд'] },
        category: 'travel'
    },
    {
        emoji: '⛽',
        keywords: { en: ['gas', 'fuel', 'petrol', 'station'], ru: ['бензин', 'топливо', 'заправка'] },
        category: 'travel'
    },
    {
        emoji: '🏠',
        keywords: { en: ['home', 'house', 'rent', 'mortgage'], ru: ['дом', 'жилье', 'аренда', 'ипотека'] },
        category: 'travel'
    },
    {
        emoji: '🏢',
        keywords: { en: ['office', 'building', 'work', 'business'], ru: ['офис', 'здание', 'работа', 'бизнес'] },
        category: 'travel'
    },
    {
        emoji: '🏨',
        keywords: { en: ['hotel', 'accommodation', 'travel'], ru: ['отель', 'гостиница', 'путешествие'] },
        category: 'travel'
    },
    {
        emoji: '🏥',
        keywords: { en: ['hospital', 'health', 'medical'], ru: ['больница', 'здоровье', 'медицина'] },
        category: 'travel'
    },
    {
        emoji: '🏦',
        keywords: { en: ['bank', 'finance', 'money'], ru: ['банк', 'финансы', 'деньги'] },
        category: 'travel'
    },
    {
        emoji: '🛣️',
        keywords: { en: ['road', 'highway', 'toll'], ru: ['дорога', 'шоссе', 'платная'] },
        category: 'travel'
    },

    // Objects - Finance focused
    {
        emoji: '💰',
        keywords: { en: ['money', 'bag', 'cash', 'wealth'], ru: ['деньги', 'мешок', 'наличные', 'богатство'] },
        category: 'objects'
    },
    {
        emoji: '💵',
        keywords: { en: ['dollar', 'money', 'cash', 'bill'], ru: ['доллар', 'деньги', 'наличные', 'купюра'] },
        category: 'objects'
    },
    { emoji: '💴', keywords: { en: ['yen', 'japan', 'money'], ru: ['йена', 'япония', 'деньги'] }, category: 'objects' },
    {
        emoji: '💶',
        keywords: { en: ['euro', 'europe', 'money'], ru: ['евро', 'европа', 'деньги'] },
        category: 'objects'
    },
    {
        emoji: '💷',
        keywords: { en: ['pound', 'british', 'money'], ru: ['фунт', 'британский', 'деньги'] },
        category: 'objects'
    },
    {
        emoji: '💳',
        keywords: { en: ['card', 'credit', 'debit', 'payment'], ru: ['карта', 'кредит', 'дебет', 'платеж'] },
        category: 'objects'
    },
    {
        emoji: '💎',
        keywords: {
            en: ['diamond', 'gem', 'luxury', 'expensive'],
            ru: ['бриллиант', 'драгоценность', 'люкс', 'дорогой']
        },
        category: 'objects'
    },
    {
        emoji: '📈',
        keywords: {
            en: ['chart', 'growth', 'increase', 'profit', 'stock'],
            ru: ['график', 'рост', 'увеличение', 'прибыль', 'акции']
        },
        category: 'objects'
    },
    {
        emoji: '📉',
        keywords: { en: ['chart', 'decline', 'decrease', 'loss'], ru: ['график', 'падение', 'снижение', 'убыток'] },
        category: 'objects'
    },
    {
        emoji: '📊',
        keywords: {
            en: ['chart', 'stats', 'analytics', 'report'],
            ru: ['диаграмма', 'статистика', 'аналитика', 'отчет']
        },
        category: 'objects'
    },
    {
        emoji: '💼',
        keywords: {
            en: ['briefcase', 'work', 'job', 'salary', 'business'],
            ru: ['портфель', 'работа', 'зарплата', 'бизнес']
        },
        category: 'objects'
    },
    {
        emoji: '🧳',
        keywords: { en: ['luggage', 'travel', 'vacation'], ru: ['багаж', 'путешествие', 'отпуск'] },
        category: 'objects'
    },
    {
        emoji: '📱',
        keywords: {
            en: ['phone', 'mobile', 'smartphone', 'cell'],
            ru: ['телефон', 'мобильный', 'смартфон', 'сотовый']
        },
        category: 'objects'
    },
    {
        emoji: '💻',
        keywords: { en: ['laptop', 'computer', 'work', 'tech'], ru: ['ноутбук', 'компьютер', 'работа', 'технологии'] },
        category: 'objects'
    },
    {
        emoji: '🖥️',
        keywords: { en: ['computer', 'desktop', 'monitor'], ru: ['компьютер', 'десктоп', 'монитор'] },
        category: 'objects'
    },
    {
        emoji: '📶',
        keywords: { en: ['internet', 'wifi', 'signal', 'network'], ru: ['интернет', 'вайфай', 'сигнал', 'сеть'] },
        category: 'objects'
    },
    {
        emoji: '💡',
        keywords: {
            en: ['idea', 'light', 'bulb', 'electricity', 'utility'],
            ru: ['идея', 'свет', 'лампа', 'электричество', 'коммуналка']
        },
        category: 'objects'
    },
    {
        emoji: '🔧',
        keywords: {
            en: ['tool', 'wrench', 'repair', 'service', 'maintenance'],
            ru: ['инструмент', 'ключ', 'ремонт', 'сервис', 'обслуживание']
        },
        category: 'objects'
    },
    {
        emoji: '🔌',
        keywords: { en: ['plug', 'electric', 'power'], ru: ['вилка', 'электрический', 'питание'] },
        category: 'objects'
    },
    {
        emoji: '🎁',
        keywords: { en: ['gift', 'present', 'birthday'], ru: ['подарок', 'презент', 'день рождения'] },
        category: 'objects'
    },
    {
        emoji: '🎓',
        keywords: {
            en: ['education', 'graduation', 'school', 'university'],
            ru: ['образование', 'выпускной', 'школа', 'университет']
        },
        category: 'objects'
    },
    {
        emoji: '📚',
        keywords: { en: ['books', 'education', 'study', 'learn'], ru: ['книги', 'образование', 'учеба', 'учиться'] },
        category: 'objects'
    },
    {
        emoji: '🏋️',
        keywords: {
            en: ['gym', 'fitness', 'workout', 'exercise'],
            ru: ['спортзал', 'фитнес', 'тренировка', 'упражнения']
        },
        category: 'objects'
    },
    {
        emoji: '💊',
        keywords: {
            en: ['medicine', 'health', 'pharmacy', 'pill'],
            ru: ['лекарство', 'здоровье', 'аптека', 'таблетка']
        },
        category: 'objects'
    },
    {
        emoji: '🛡️',
        keywords: {
            en: ['shield', 'protection', 'insurance', 'security'],
            ru: ['щит', 'защита', 'страховка', 'безопасность']
        },
        category: 'objects'
    },
    {
        emoji: '🛍️',
        keywords: { en: ['shopping', 'bags', 'retail', 'store'], ru: ['шопинг', 'пакеты', 'магазин', 'покупки'] },
        category: 'objects'
    },
    {
        emoji: '👔',
        keywords: { en: ['tie', 'business', 'formal', 'clothes'], ru: ['галстук', 'бизнес', 'формальный', 'одежда'] },
        category: 'objects'
    },
    {
        emoji: '👗',
        keywords: { en: ['dress', 'clothes', 'fashion'], ru: ['платье', 'одежда', 'мода'] },
        category: 'objects'
    },
    {
        emoji: '👟',
        keywords: { en: ['shoes', 'sneakers', 'sport'], ru: ['обувь', 'кроссовки', 'спорт'] },
        category: 'objects'
    },
    {
        emoji: '🎬',
        keywords: { en: ['movie', 'cinema', 'film', 'entertainment'], ru: ['кино', 'фильм', 'развлечения'] },
        category: 'objects'
    },
    {
        emoji: '🎮',
        keywords: { en: ['game', 'gaming', 'play', 'entertainment'], ru: ['игра', 'гейминг', 'играть', 'развлечения'] },
        category: 'objects'
    },
    {
        emoji: '🎵',
        keywords: { en: ['music', 'song', 'audio', 'spotify'], ru: ['музыка', 'песня', 'аудио', 'спотифай'] },
        category: 'objects'
    },
    {
        emoji: '📺',
        keywords: { en: ['tv', 'television', 'netflix', 'streaming'], ru: ['телевизор', 'тв', 'нетфликс', 'стриминг'] },
        category: 'objects'
    },
    {
        emoji: '🔑',
        keywords: { en: ['key', 'rent', 'home', 'security'], ru: ['ключ', 'аренда', 'дом', 'безопасность'] },
        category: 'objects'
    },
    {
        emoji: '🧹',
        keywords: { en: ['cleaning', 'home', 'service'], ru: ['уборка', 'дом', 'сервис'] },
        category: 'objects'
    },
    {
        emoji: '🧺',
        keywords: { en: ['laundry', 'clothes', 'wash'], ru: ['стирка', 'белье', 'мыть'] },
        category: 'objects'
    },
    {
        emoji: '🛠️',
        keywords: {
            en: ['tools', 'repair', 'fix', 'maintenance'],
            ru: ['инструменты', 'ремонт', 'чинить', 'обслуживание']
        },
        category: 'objects'
    },
    {
        emoji: '⚙️',
        keywords: { en: ['settings', 'gear', 'config'], ru: ['настройки', 'шестеренка', 'конфиг'] },
        category: 'objects'
    },
    {
        emoji: '📦',
        keywords: {
            en: ['package', 'box', 'delivery', 'shipping'],
            ru: ['посылка', 'коробка', 'доставка', 'отправка']
        },
        category: 'objects'
    },

    // Symbols
    {
        emoji: '❤️',
        keywords: { en: ['heart', 'love', 'favorite'], ru: ['сердце', 'любовь', 'избранное'] },
        category: 'symbols'
    },
    {
        emoji: '💚',
        keywords: { en: ['green heart', 'eco', 'nature'], ru: ['зеленое сердце', 'эко', 'природа'] },
        category: 'symbols'
    },
    {
        emoji: '⭐',
        keywords: { en: ['star', 'favorite', 'rating'], ru: ['звезда', 'избранное', 'рейтинг'] },
        category: 'symbols'
    },
    {
        emoji: '✅',
        keywords: { en: ['check', 'done', 'complete', 'yes'], ru: ['галочка', 'готово', 'завершено', 'да'] },
        category: 'symbols'
    },
    {
        emoji: '❌',
        keywords: { en: ['cross', 'no', 'cancel', 'delete'], ru: ['крест', 'нет', 'отмена', 'удалить'] },
        category: 'symbols'
    },
    {
        emoji: '⚠️',
        keywords: { en: ['warning', 'alert', 'caution'], ru: ['предупреждение', 'внимание', 'осторожно'] },
        category: 'symbols'
    },
    {
        emoji: '🔔',
        keywords: { en: ['bell', 'notification', 'alert', 'reminder'], ru: ['колокол', 'уведомление', 'напоминание'] },
        category: 'symbols'
    },
    {
        emoji: '🔒',
        keywords: { en: ['lock', 'security', 'private', 'safe'], ru: ['замок', 'безопасность', 'приватный', 'сейф'] },
        category: 'symbols'
    },
    {
        emoji: '➕',
        keywords: { en: ['plus', 'add', 'new', 'income'], ru: ['плюс', 'добавить', 'новый', 'доход'] },
        category: 'symbols'
    },
    {
        emoji: '➖',
        keywords: { en: ['minus', 'remove', 'expense'], ru: ['минус', 'удалить', 'расход'] },
        category: 'symbols'
    },
    {
        emoji: '💲',
        keywords: { en: ['dollar', 'money', 'price', 'cost'], ru: ['доллар', 'деньги', 'цена', 'стоимость'] },
        category: 'symbols'
    },
    {
        emoji: '💹',
        keywords: { en: ['chart', 'growth', 'yen', 'stock'], ru: ['график', 'рост', 'йена', 'акции'] },
        category: 'symbols'
    },
    {
        emoji: '🔄',
        keywords: {
            en: ['refresh', 'sync', 'recurring', 'repeat'],
            ru: ['обновить', 'синхронизация', 'повторяющийся', 'повтор']
        },
        category: 'symbols'
    },
    {
        emoji: '📌',
        keywords: {
            en: ['pin', 'location', 'mark', 'important'],
            ru: ['булавка', 'местоположение', 'отметка', 'важно']
        },
        category: 'symbols'
    },
    {
        emoji: '🏷️',
        keywords: { en: ['tag', 'label', 'price', 'category'], ru: ['тег', 'метка', 'цена', 'категория'] },
        category: 'symbols'
    },

    // Flags (top currencies)
    {
        emoji: '🇺🇸',
        keywords: { en: ['usa', 'america', 'dollar', 'usd'], ru: ['сша', 'америка', 'доллар'] },
        category: 'flags'
    },
    { emoji: '🇪🇺', keywords: { en: ['eu', 'europe', 'euro', 'eur'], ru: ['ес', 'европа', 'евро'] }, category: 'flags' },
    {
        emoji: '🇬🇧',
        keywords: { en: ['uk', 'britain', 'pound', 'gbp'], ru: ['великобритания', 'британия', 'фунт'] },
        category: 'flags'
    },
    { emoji: '🇯🇵', keywords: { en: ['japan', 'yen', 'jpy'], ru: ['япония', 'йена'] }, category: 'flags' },
    { emoji: '🇨🇳', keywords: { en: ['china', 'yuan', 'cny'], ru: ['китай', 'юань'] }, category: 'flags' },
    { emoji: '🇷🇺', keywords: { en: ['russia', 'ruble', 'rub'], ru: ['россия', 'рубль'] }, category: 'flags' },
    { emoji: '🇨🇭', keywords: { en: ['switzerland', 'franc', 'chf'], ru: ['швейцария', 'франк'] }, category: 'flags' },
    { emoji: '🇦🇺', keywords: { en: ['australia', 'dollar', 'aud'], ru: ['австралия', 'доллар'] }, category: 'flags' },
    { emoji: '🇨🇦', keywords: { en: ['canada', 'dollar', 'cad'], ru: ['канада', 'доллар'] }, category: 'flags' },
    { emoji: '🇮🇳', keywords: { en: ['india', 'rupee', 'inr'], ru: ['индия', 'рупия'] }, category: 'flags' }
]
