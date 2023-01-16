import { Component } from 'react'
import {
    ThemeSwitcherProvider,
    useThemeSwitcher,
} from 'react-css-theme-switcher'
import { Provider } from 'react-redux'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import Login from './containers/Login'
import PageRoot from './containers/PageRoot'
import reducers from './redux/reducers'
import CrashReporter from './utils/CrashReporter'
import StorageHelper from './utils/StorageHelper'

CrashReporter.getInstance().init()

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore)
const store = createStoreWithMiddleware(reducers)
type AppState = {
    isDarkMode: boolean
}

const themes = {
    dark: `dark-theme.css`,
    light: `light-theme.css`,
}

const MainComponent = () => {
    const { status } = useThemeSwitcher()

    if (status === 'loading') {
        // Just an empty div until styles load
        return <div></div>
    }

    return (
        <div className="full-screen">
            <HashRouter>
                <Switch>
                    <Route path="/login/" component={Login} />
                    <Route path="/" component={PageRoot} />
                </Switch>
            </HashRouter>
        </div>
    )
}

class App extends Component<{}, AppState> {
    constructor(props: any) {
        super(props)
        this.state = {
            isDarkMode: StorageHelper.getDarkModeFromLocalStorage(),
        }
    }

    render() {
        return (
            <ThemeSwitcherProvider
                themeMap={themes}
                defaultTheme={this.state.isDarkMode ? 'dark' : 'light'}
                insertionPoint="styles-insertion-point"
            >
                <Provider store={store}>
                    <MainComponent />
                </Provider>
            </ThemeSwitcherProvider>
        )
    }
}

export default App
