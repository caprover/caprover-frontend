import { Locale } from 'antd/es/locale-provider'
import enUS from 'antd/es/locale/en_US'
import zhCN from 'antd/es/locale/zh_CN'
import enUSMessages from '../locales/en-US.json'
import zhCNMessages from '../locales/zh-CN.json'

import StorageHelper from './StorageHelper'

export interface LanguageOption {
    label: string
    value: string
    alias?: string[]
    antdLocale: Locale
    messages: Record<string, string>
}

const languagesOptions: LanguageOption[] = [
    // en-US should be the first option
    {
        label: 'English',
        value: 'en-US',
        alias: ['en'],
        antdLocale: enUS,
        messages: enUSMessages,
    },
    {
        label: '简体中文',
        value: 'zh-CN',
        alias: ['zh'],
        antdLocale: zhCN,
        messages: zhCNMessages,
    },
]

const defaultLanguageOptions = languagesOptions[0]

const currentLanguage = StorageHelper.getLanguageFromLocalStorage()

const currentLanguageOption: LanguageOption =
    languagesOptions.find((o) => {
        return o.value === currentLanguage || o.alias?.includes(currentLanguage)
    }) || defaultLanguageOptions

export function localize(key: string, message: string) {
    return currentLanguageOption.messages[key] || message
}

export { currentLanguageOption, languagesOptions }
