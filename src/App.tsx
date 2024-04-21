import { App as AntdApp, ConfigProvider, theme } from 'antd'
import { useState } from 'react'
import { Provider } from 'react-redux'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import Login from './containers/Login'
import PageRoot from './containers/PageRoot'
import DarkModeContext from './contexts/DarkModeContext'
import reducers from './redux/reducers'
import './styles/style.css'
import CrashReporter from './utils/CrashReporter'
import { currentLanguageOption } from './utils/Language'
import StorageHelper from './utils/StorageHelper'

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

function App() {
    const { defaultAlgorithm, darkAlgorithm } = theme
    const [isDarkMode, setIsDarkMode] = useState(
        StorageHelper.getDarkModeFromLocalStorage()
    )

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? darkAlgorithm : defaultAlgorithm,
                token: {
                    colorPrimary: '#1b8ad3',
                    colorLink: '#1b8ad3',
                    fontFamily: `QuickSand, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
                        'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
                        'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
                },
            }}
            locale={currentLanguageOption.antdLocale}
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
                <Provider store={store}>
                    <MainComponent />
                </Provider>
            </DarkModeContext.Provider>
        </ConfigProvider>
    )
}

export default App
