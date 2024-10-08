import { Locale } from 'antd/es/locale'
import arEG from 'antd/es/locale/ar_EG'
import deDE from 'antd/es/locale/de_DE'
import enUS from 'antd/es/locale/en_US'
import esES from 'antd/es/locale/es_ES'
import faIR from 'antd/es/locale/fa_IR'
import frFR from 'antd/es/locale/fr_FR'
import idID from 'antd/es/locale/id_ID'
import ptBR from 'antd/es/locale/pt_BR'
import svSE from 'antd/es/locale/sv_SE'
import zhCN from 'antd/es/locale/zh_CN'
import arEGMessages from '../locales/ar-EG.json'
import deDEMessages from '../locales/de-DE.json'
import enUSMessages from '../locales/en-US.json'
import esESMessages from '../locales/es-ES.json'
import faIRMessages from '../locales/fa-IR.json'
import frFRMessages from '../locales/fr-FR.json'
import idIDMessages from '../locales/id-ID.json'
import ptBRMessages from '../locales/pt-BR.json'
import svSEMessages from '../locales/sv-SE.json'
import zhCNMessages from '../locales/zh-CN.json'

import StorageHelper from './StorageHelper'

export interface LanguageOption {
    label: string
    value: string
    alias?: string[]
    antdLocale: Locale
    messages: Record<string, string>
    rtl?: boolean
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
        label: 'Português',
        value: 'pt-BR',
        alias: ['pt'],
        antdLocale: ptBR,
        messages: ptBRMessages,
    },
    {
        label: '简体中文',
        value: 'zh-CN',
        alias: ['zh'],
        antdLocale: zhCN,
        messages: zhCNMessages,
    },
    {
        label: 'Español',
        value: 'es-ES',
        alias: ['es'],
        antdLocale: esES,
        messages: esESMessages,
    },
    {
        label: 'Deutsch',
        value: 'de-DE',
        alias: ['de'],
        antdLocale: deDE,
        messages: deDEMessages,
    },
    {
        label: 'Bahasa Indonesia',
        value: 'id-ID',
        alias: ['id'],
        antdLocale: idID,
        messages: idIDMessages,
    },
    {
        label: 'Français',
        value: 'fr-FR',
        alias: ['fr'],
        antdLocale: frFR,
        messages: frFRMessages,
    },
    {
        label: 'Svenska',
        value: 'sv-SE',
        alias: ['sv'],
        antdLocale: svSE,
        messages: svSEMessages,
    },
    {
        label: 'فارسی',
        value: 'fa-IR',
        alias: ['fa'],
        antdLocale: faIR,
        rtl: true,
        messages: faIRMessages,
    },
    {
        label: 'العربية',
        value: 'ar-EG',
        alias: ['ar'],
        antdLocale: arEG,
        rtl: true,
        messages: arEGMessages,
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

// Currently only enable language for dev mode or demo, until the vast majority of the content is translated
export const isLanguageEnabled = true
// !!process.env.REACT_APP_IS_DEBUG ||
// window.location.href.includes('server.demo.caprover.com')
