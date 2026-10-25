import Logger from './Logger'

const fallbackNoOps = {
    getItem(t: string) {
        return ''
    },
    setItem(t: string, v: string) {},
}
const localStorage = window.localStorage ? window.localStorage : fallbackNoOps
const sessionStorage = window.sessionStorage
    ? window.sessionStorage
    : fallbackNoOps

const AUTH_KEY = 'CAPROVER_AUTH_KEY'
const SIDER_COLLAPSED_STATE = 'CAPROVER_SIDER_COLLAPSED_STATE'
const SETUP_DISMISSED = 'CAPROVER_SETUP_DISMISSED'
const DARK_MODE = 'CAPROVER_DARK_MODE'
const LANGUAGE = 'CAPROVER_LANGUAGE'
const APP_PROJECT_SPLIT_RATIO = 'APP_PROJECT_SPLIT_RATIO'
export const REMEMBER_ME_OPTION = 'CAPROVER_REMEMBER_ME_OPTION'

class StorageHelper {
    getAuthKeyFromStorage() {
        const localStorageAuth = localStorage.getItem(AUTH_KEY)
        return localStorageAuth
            ? localStorageAuth
            : sessionStorage.getItem(AUTH_KEY) || ''
    }

    clearAuthKeys() {
        localStorage.setItem(AUTH_KEY, '')
        sessionStorage.setItem(AUTH_KEY, '')
    }

    setAuthKeyInSessionStorage(authKey: string) {
        sessionStorage.setItem(AUTH_KEY, authKey)
        localStorage.setItem(AUTH_KEY, '')
    }

    setAuthKeyInLocalStorage(authKey: string) {
        localStorage.setItem(AUTH_KEY, authKey)
        sessionStorage.setItem(AUTH_KEY, '')
    }

    setRememberMeOptionInLocalStorage(option: number): void {
        if (!Number.isInteger(option)) return

        try {
            localStorage.setItem(REMEMBER_ME_OPTION, JSON.stringify(option))
        } catch (error) {
            Logger.dev('Unable to persist Remember Me option')
        }
    }

    getRememberMeOptionFromLocalStorage(): number | undefined {
        let storageValue = ''
        try {
            storageValue = localStorage.getItem(REMEMBER_ME_OPTION) || ''
        } catch (error) {
            Logger.dev('Unable to read Remember Me option')
            return undefined
        }
        if (!storageValue) return undefined

        try {
            const parsedValue: unknown = JSON.parse(storageValue)
            return typeof parsedValue === 'number' &&
                Number.isInteger(parsedValue)
                ? parsedValue
                : undefined
        } catch (error) {
            Logger.dev('Unable to parse Remember Me option')
            return undefined
        }
    }

    setSiderCollapsedStateInLocalStorage(siderCollapsed: boolean) {
        localStorage.setItem(
            SIDER_COLLAPSED_STATE,
            JSON.stringify(siderCollapsed)
        )
    }

    getSiderCollapsedStateFromLocalStorage(): boolean {
        const storageValue = localStorage.getItem(SIDER_COLLAPSED_STATE)
        return storageValue && JSON.parse(storageValue)
    }

    getSetupDismissedFromLocalStorage(): boolean {
        try {
            return localStorage.getItem(SETUP_DISMISSED) === 'true'
        } catch (error) {
            Logger.dev('Unable to read setup dismissal')
            return false
        }
    }

    setSetupDismissedInLocalStorage() {
        try {
            localStorage.setItem(SETUP_DISMISSED, 'true')
        } catch (error) {
            Logger.dev('Unable to persist setup dismissal')
        }
    }

    setDarkModeInLocalStorage(isDarkMode: boolean) {
        localStorage.setItem(DARK_MODE, JSON.stringify(isDarkMode))
    }

    getDarkModeFromLocalStorage(): boolean {
        const isDarkMode = localStorage.getItem(DARK_MODE)
        return isDarkMode
            ? JSON.parse(isDarkMode)
            : window.matchMedia &&
                  window.matchMedia('(prefers-color-scheme: dark)').matches
    }

    setLanguageInLocalStorage(language: string) {
        localStorage.setItem(LANGUAGE, language)
    }

    getLanguageFromLocalStorage(): string {
        const language = localStorage.getItem(LANGUAGE)
        return language ? language : navigator.language
    }

    setAppProjectSplitRatioInLocalStorage(ratio: number) {
        localStorage.setItem(APP_PROJECT_SPLIT_RATIO, `${ratio || 0}`)
    }

    getAppProjectSplitRatioFromLocalStorage(): number {
        const ratio = localStorage.getItem(APP_PROJECT_SPLIT_RATIO)
        return ratio ? parseFloat(ratio) : 0.2 // Default to 20% if not set
    }
}

const instance = new StorageHelper()
export default instance
