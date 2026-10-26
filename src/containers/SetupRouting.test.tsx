import '@testing-library/jest-dom'
import { configureStore } from '@reduxjs/toolkit'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { Provider } from 'react-redux'
import { Route, Router, Switch } from 'react-router-dom'
import { SetupStatus } from '../models/SetupStatus'
import {
    dismissSetup,
    emitSetupStatusChanged,
} from '../redux/actions/SetupActions'
import rootReducer from '../redux/reducers'
import ApiManager from '../api/ApiManager'
import Dashboard from './Dashboard'
import LoggedInCatchAll from './LoggedInCatchAll'
import Setup from './Setup'

jest.mock('../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('./settings/DomainsHttps', () => () => (
    <div>Guided domain and HTTPS controls</div>
))

function showRoute(path: string, status: SetupStatus, dismissed = false) {
    const store = configureStore({ reducer: rootReducer })
    store.dispatch(emitSetupStatusChanged(status))
    if (dismissed) store.dispatch(dismissSetup())
    const history = createMemoryHistory({ initialEntries: [path] })
    render(
        <Provider store={store}>
            <Router history={history}>
                <Switch>
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/setup" component={Setup} />
                    <Route
                        path="/overview"
                        render={() => <div>Operational overview</div>}
                    />
                    <Route
                        path="/apps/details/:name"
                        render={() => <div>App details</div>}
                    />
                    <Route path="/apps" render={() => <div>Apps</div>} />
                    <Route path="/" component={LoggedInCatchAll} />
                </Switch>
            </Router>
        </Provider>
    )
    return { history, store }
}
beforeEach(() => {
    localStorage.clear()
    jest.spyOn(ApiManager, 'isLoggedIn').mockReturnValue(true)
})
afterEach(() => jest.restoreAllMocks())

it.each(['/', '/dashboard', '/dashboard?redirectToAppsIfFullySetup=true'])(
    'lands incomplete installations on Setup from %s',
    (path) => {
        const { history } = showRoute(path, SetupStatus.Required)
        expect(history.location.pathname).toBe('/setup')
        expect(
            screen.getByText('Guided domain and HTTPS controls')
        ).toBeInTheDocument()
    }
)
it.each(['/dashboard', '/setup'])(
    'lands completed installations on Overview from %s',
    (path) => {
        const { history } = showRoute(path, SetupStatus.Complete)
        expect(history.location.pathname).toBe('/overview')
    }
)
it.each(['/', '/dashboard?redirectToAppsIfFullySetup=true'])(
    'lands completed installations on Apps when requested from %s',
    (path) => {
        const { history } = showRoute(path, SetupStatus.Complete)
        expect(history.location.pathname).toBe('/apps')
        expect(screen.getByText('Apps')).toBeInTheDocument()
    }
)
it.each(['/', '/dashboard?redirectToAppsIfFullySetup=true'])(
    'waits for setup status before routing completed installations to Apps from %s',
    (path) => {
        const { history, store } = showRoute(path, SetupStatus.Loading)
        expect(history.location.pathname).toBe('/dashboard')
        act(() => {
            store.dispatch(emitSetupStatusChanged(SetupStatus.Complete))
        })
        expect(history.location.pathname).toBe('/apps')
    }
)
it('waits for setup status before routing an incomplete installation', () => {
    const { history, store } = showRoute('/', SetupStatus.Loading)
    expect(history.location.pathname).toBe('/dashboard')
    act(() => {
        store.dispatch(emitSetupStatusChanged(SetupStatus.Required))
    })
    expect(history.location.pathname).toBe('/setup')
})
it('dismisses an HTTP-only installation immediately and preserves the required server state', () => {
    const { history, store } = showRoute('/setup', SetupStatus.Required)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Setup' }))
    expect(history.location.pathname).toBe('/overview')
    expect(store.getState().globalReducer.setupStatus).toBe(
        SetupStatus.Required
    )
    expect(localStorage.getItem('CAPROVER_SETUP_DISMISSED')).toBe('true')
})
it('resolves a legacy dashboard link to Overview after HTTP-only dismissal', () => {
    const { history } = showRoute('/dashboard', SetupStatus.Required, true)
    expect(history.location.pathname).toBe('/overview')
})
it('navigates to Overview immediately when Force HTTPS completes', () => {
    const { history, store } = showRoute('/setup', SetupStatus.Required)
    act(() => {
        store.dispatch(emitSetupStatusChanged(SetupStatus.Complete))
    })
    expect(history.location.pathname).toBe('/overview')
})
it('shows a retry action on setup API failure while keeping Overview and deep links accessible', () => {
    const { history } = showRoute('/dashboard', SetupStatus.Failed)
    expect(screen.getByText('Setup status is unavailable.')).toBeInTheDocument()
    expect(
        screen.getByRole('button', { name: 'Try again' })
    ).toBeInTheDocument()
    act(() => history.push('/overview'))
    expect(screen.getByText('Operational overview')).toBeInTheDocument()
    act(() => history.push('/apps/details/api'))
    expect(screen.getByText('App details')).toBeInTheDocument()
})
