import React, { Component } from 'react'
import { Provider } from 'react-redux'
import { HashRouter, Route, Switch } from 'react-router-dom'
import { applyMiddleware, createStore } from 'redux'
import thunk from 'redux-thunk'
import './App.css'
import Login from './containers/Login'
import PageRoot from './containers/PageRoot'
import reducers from './redux/reducers'
import CrashReporter from './utils/CrashReporter'
import DarkModeHelper from './utils/ThemeModeHelper'
CrashReporter.getInstance().init()

const createStoreWithMiddleware = applyMiddleware(thunk)(createStore)
const store = createStoreWithMiddleware(reducers)
type AppState = {
    themeLoaded: boolean
}

class App extends Component<{}, AppState> {
    constructor(props: any) {
        super(props)
        this.state = {
            themeLoaded: false,
        }
        const { isDarkMode } = store.getState().globalReducer
        DarkModeHelper.loadTheme(isDarkMode).then(() => {
            this.setState({ themeLoaded: true })
        })
    }

    render() {
        const { themeLoaded } = this.state
        const { isDarkMode } = store.getState().globalReducer
        if (!themeLoaded) return <div /> // prevent theme visible swapping

        return (
            <Provider store={store}>
                <div
                    className={[
                        'full-screen',
                        `${isDarkMode ? 'dark-theme' : 'light-theme'}`,
                    ].join(' ')}
                >
                    <HashRouter>
                        <Switch>
                            <Route path="/login/" component={Login} />
                            <Route path="/" component={PageRoot} />
                        </Switch>
                    </HashRouter>
                </div>
            </Provider>
        )
    }
}

export default App
