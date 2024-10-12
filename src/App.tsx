import { App as AntdApp, ConfigProvider, theme } from 'antd'
import React from 'react'
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
import { getCurrentLanguageOption, LanguageOption } from './utils/Language'
import StorageHelper from './utils/StorageHelper'

CrashReporter.getInstance().init()

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore)
const store = createStoreWithMiddleware(reducers)

class App extends React.Component<
    any,
    { isDarkMode: boolean; currentLanguageOption: LanguageOption }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isDarkMode: StorageHelper.getDarkModeFromLocalStorage(),
            currentLanguageOption: getCurrentLanguageOption(),
        }
    }

    render() {
        const { defaultAlgorithm, darkAlgorithm } = theme
        const currentLanguageOption = this.state.currentLanguageOption

        const self = this

        return (
            <ConfigProvider
                direction={currentLanguageOption.rtl ? 'rtl' : 'ltr'}
                theme={{
                    algorithm: this.state.isDarkMode
                        ? darkAlgorithm
                        : defaultAlgorithm,
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
                        isDarkMode: this.state.isDarkMode,
                        setIsDarkMode: (value: boolean) => {
                            self.setState({ isDarkMode: value })
                            StorageHelper.setDarkModeInLocalStorage(value)
                        },
                    }}
                >
                    <Provider store={store}>
                        <AntdApp className="full-screen">
                            <HashRouter>
                                <Switch>
                                    <Route path="/login/" component={Login} />
                                    <Route path="/" component={PageRoot} />
                                </Switch>
                            </HashRouter>
                        </AntdApp>
                    </Provider>
                </DarkModeContext.Provider>
            </ConfigProvider>
        )
    }
}

export default App
