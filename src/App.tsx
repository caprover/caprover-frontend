import { App as AntdApp, ConfigProvider, theme, ThemeConfig } from 'antd'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import CenteredSpinner from './containers/global/CenteredSpinner'
import Login from './containers/Login'
import PageRoot from './containers/PageRoot'
import CapRoverThemeContext from './contexts/CapRoverThemeContext'
import DarkModeContext from './contexts/DarkModeContext'
import LanguageContext from './contexts/LanguageContext'
import reducers from './redux/reducers'
import './styles/style.css'
import CapRoverTheme from './styles/theme/CapRoverTheme'
import ThemeParser from './styles/theme/ThemeParser'
import { ThemeProvider } from './styles/theme/ThemeProvider'
import CrashReporter from './utils/CrashReporter'
import { getCurrentLanguageOption } from './utils/Language'
import StorageHelper from './utils/StorageHelper'
import Toaster from './utils/Toaster'

CrashReporter.getInstance().init()

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore)
const store = createStoreWithMiddleware(reducers)

const MainComponent = () => {
    return (
        <AntdApp className="full-screen">
            <HashRouter>
                <Switch>
                    <Route path="/login/" component={Login} />
                    <Route path="/" component={PageRoot} />
                </Switch>
            </HashRouter>
        </AntdApp>
    )
}

let themeState: undefined | 'LOADING' | 'LOADED' | 'TIMED_OUT' = undefined

function App() {
    const { defaultAlgorithm, darkAlgorithm } = theme

    const [isDarkMode, setIsDarkMode] = useState(
        StorageHelper.getDarkModeFromLocalStorage()
    )
    const [currTheme, setTheme] = useState(
        undefined as undefined | CapRoverTheme
    )
    const [refreshCounter, setRefreshCounter] = useState(0)
    const [currentLang, setCurrentLang] = useState(getCurrentLanguageOption())

    const defaultTheme = {
        algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
        token: {
            colorPrimary: '#1b8ad3',
            colorLink: '#1b8ad3',
            fontFamily: `QuickSand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
                'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        },
    }

    const customTheme = currTheme
        ? ThemeParser.parseTheme(
              currTheme,
              isDarkMode,
              defaultAlgorithm,
              darkAlgorithm
          )
        : undefined

    const themeToUse: ThemeConfig = customTheme || defaultTheme

    if (!themeState) {
        themeState = 'LOADING'
        setTimeout(() => {
            if (themeState === 'LOADING') {
                themeState = 'TIMED_OUT'
                setRefreshCounter(refreshCounter + 1)
            }
        }, 600)
        ThemeProvider.getInstance()
            .getCurrentTheme()
            .then((t) => {
                setTheme(t.theme)
            })
            .catch(Toaster.createCatcher())
            .then(() => {
                themeState = 'LOADED'
                setRefreshCounter(refreshCounter + 1)
            })
    }

    return (
        <ConfigProvider
            direction={currentLang.rtl ? 'rtl' : 'ltr'}
            theme={themeToUse}
            locale={currentLang.antdLocale}
        >
            <LanguageContext.Provider
                value={{
                    currentLanguage: currentLang,
                    setCurrentLanguageOptionContext: (value) => {
                        setCurrentLang(value)
                    },
                }}
            >
                <DarkModeContext.Provider
                    value={{
                        isDarkMode,
                        setIsDarkMode: (value) => {
                            setIsDarkMode(value)
                            StorageHelper.setDarkModeInLocalStorage(value)
                        },
                    }}
                >
                    <CapRoverThemeContext.Provider
                        value={{
                            currentTheme: currTheme,
                            setCapRoverThemeContext: (value) => {
                                setTheme(value)
                            },
                        }}
                    >
                        <Provider store={store}>
                            {themeState === 'LOADING' ? (
                                <CenteredSpinner />
                            ) : (
                                <MainComponent />
                            )}
                        </Provider>
                    </CapRoverThemeContext.Provider>
                </DarkModeContext.Provider>
            </LanguageContext.Provider>
        </ConfigProvider>
    )
}

export default App
