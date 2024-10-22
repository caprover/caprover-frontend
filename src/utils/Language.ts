import { Locale } from 'antd/es/locale'
import arEG from 'antd/es/locale/ar_EG'
import deDE from 'antd/es/locale/de_DE'
import enUS from 'antd/es/locale/en_US'
import esES from 'antd/es/locale/es_ES'
import faIR from 'antd/es/locale/fa_IR'
import frFR from 'antd/es/locale/fr_FR'
import idID from 'antd/es/locale/id_ID'
import nlNL from 'antd/es/locale/nl_NL'
import ptBR from 'antd/es/locale/pt_BR'
import svSE from 'antd/es/locale/sv_SE'
import trTR from 'antd/es/locale/tr_TR'
import zhCN from 'antd/es/locale/zh_CN'
import arEGMessages from '../locales/ar-EG.json'
import deDEMessages from '../locales/de-DE.json'
import enUSMessages from '../locales/en-US.json'
import esESMessages from '../locales/es-ES.json'
import faIRMessages from '../locales/fa-IR.json'
import frFRMessages from '../locales/fr-FR.json'
import idIDMessages from '../locales/id-ID.json'
import nlNLMessages from '../locales/nl-NL.json'
import ptBRMessages from '../locales/pt-BR.json'
import svSEMessages from '../locales/sv-SE.json'
import trTRMessages from '../locales/tr-TR.json'
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
        label: 'Nederlands',
        value: 'nl-NL',
        alias: ['nl'],
        antdLocale: nlNL,
        messages: nlNLMessages,
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
    {
        label: 'Türkçe',
        value: 'tr-TR',
        alias: ['tr'],
        antdLocale: trTR,
        messages: trTRMessages,
    },
]

const defaultLanguageOptions = languagesOptions[0]

const savedLanguageInBrowser = StorageHelper.getLanguageFromLocalStorage()

function findLanguageOption(language: string): LanguageOption {
    return (
        languagesOptions.find((o) => {
            return o.value === language || o.alias?.includes(language)
        }) || defaultLanguageOptions
    )
}

let currentLanguageOption = findLanguageOption(savedLanguageInBrowser)

export function localize(key: string, message: string) {
    return currentLanguageOption.messages[key] || message
}

export function getCurrentLanguageOption() {
    return currentLanguageOption
}

export function setCurrentLanguageOption(
    languageAcronym: string
): LanguageOption {
    currentLanguageOption = findLanguageOption(languageAcronym)
    StorageHelper.setLanguageInLocalStorage(currentLanguageOption.value)

    return currentLanguageOption
}

setCurrentLanguageOption(savedLanguageInBrowser)

export { languagesOptions }

// Currently only enable language for dev mode or demo, until the vast majority of the content is translated
export const isLanguageEnabled = true
// !!process.env.REACT_APP_IS_DEBUG ||
// window.location.href.includes('server.demo.caprover.com')
