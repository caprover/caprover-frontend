import '@testing-library/jest-dom'
import {
    act,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { Provider } from 'react-redux'
import { Route, Router } from 'react-router-dom'
import { createStore } from 'redux'
import ApiManager from '../../api/ApiManager'
import ProjectDefinition from '../../models/ProjectDefinition'
import Toaster from '../../utils/Toaster'
import Apps from './Apps'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, message: string) => message,
}))

jest.mock('../../api/ApiManager', () => ({
    __esModule: true,
    default: class {
        getAllApps() {
            return Promise.resolve()
        }
        getAllProjects() {
            return Promise.resolve()
        }
        registerNewApp() {
            return Promise.resolve()
        }
        destroy() {}
    },
}))

const projects: ProjectDefinition[] = [
    { id: 'production', name: 'Production', description: '' },
]

const renderApps = async (
    availableProjects: ProjectDefinition[] = [],
    isMobile = false
) => {
    const history = createMemoryHistory({ initialEntries: ['/apps/'] })
    const getAllApps = jest
        .spyOn(ApiManager.prototype, 'getAllApps')
        .mockResolvedValue({
            appDefinitions: [],
            defaultNginxConfig: '',
            rootDomain: 'example.com',
            captainSubDomain: 'captain',
        })
    const getAllProjects = jest
        .spyOn(ApiManager.prototype, 'getAllProjects')
        .mockResolvedValue({ projects: availableProjects })
    const registerNewApp = jest
        .spyOn(ApiManager.prototype, 'registerNewApp')
        .mockResolvedValue(undefined)
    const store = createStore(() => ({ globalReducer: { isMobile } }))
    render(
        <Provider store={store}>
            <Router history={history}>
                <Route path="/apps" component={Apps} />
            </Router>
        </Provider>
    )
    await screen.findByRole('button', { name: /Create App/ })
    return { api: { getAllApps, getAllProjects }, registerNewApp, history }
}

const openModal = async () => {
    fireEvent.click(screen.getByRole('button', { name: /Create App/ }))
    fireEvent.click(await screen.findByRole('menuitem', { name: /Empty App/ }))
    return screen.findByRole('dialog')
}

const submitForm = (dialog: HTMLElement) => {
    fireEvent.submit(dialog.querySelector('form') as HTMLFormElement)
}

jest.setTimeout(15000)

beforeAll(() => {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: undefined,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        }),
    })
})

beforeEach(() => {
    jest.spyOn(Toaster, 'toastError').mockImplementation(() => undefined)
})

afterEach(() => jest.restoreAllMocks())

it.each([false, true])(
    'keeps creation accessible on a new installation (mobile: %s)',
    async (isMobile) => {
        await renderApps([], isMobile)
        expect(
            screen.getByText(
                'Create your first application using Create App above.'
            )
        ).toBeInTheDocument()
        const dialog = await openModal()
        expect(within(dialog).getByLabelText('Application Name')).toHaveValue(
            ''
        )
        expect(
            within(dialog).queryByText('Parent project')
        ).not.toBeInTheDocument()
        expect(within(dialog).getByRole('checkbox')).not.toBeChecked()
        expect(within(dialog).getByRole('link')).toHaveAttribute(
            'href',
            'https://caprover.com/docs/persistent-apps.html'
        )
    }
)

it.each([
    ['One-Click App', '/apps/oneclick'],
    ['Docker Compose', '/apps/dockercompose'],
])('navigates immediately from %s', async (label, path) => {
    const { history, registerNewApp } = await renderApps()
    fireEvent.click(screen.getByRole('button', { name: /Create App/ }))
    expect(await screen.findAllByRole('menuitem')).toHaveLength(3)
    fireEvent.click(screen.getByRole('menuitem', { name: new RegExp(label) }))
    expect(history.location.pathname).toBe(path)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(registerNewApp).not.toHaveBeenCalled()
})

it('requires a name and preserves backend validation for other names', async () => {
    const { registerNewApp } = await renderApps()
    const dialog = await openModal()
    submitForm(dialog)
    expect(
        await screen.findByText('Enter an application name.')
    ).toBeInTheDocument()
    expect(registerNewApp).not.toHaveBeenCalled()
    registerNewApp.mockRejectedValueOnce('Invalid app name')
    fireEvent.change(within(dialog).getByLabelText('Application Name'), {
        target: { value: 'INVALID NAME' },
    })
    submitForm(dialog)
    await waitFor(() =>
        expect(Toaster.toastError).toHaveBeenCalledWith('Invalid app name')
    )
    expect(registerNewApp).toHaveBeenCalledWith('INVALID NAME', '', false, true)
    expect(within(dialog).getByLabelText('Application Name')).toHaveValue(
        'INVALID NAME'
    )
})

it('sends the default arguments, closes on success, and reloads the app list', async () => {
    const { api, registerNewApp } = await renderApps()
    const dialog = await openModal()
    fireEvent.change(within(dialog).getByLabelText('Application Name'), {
        target: { value: 'my-amazing-app' },
    })
    submitForm(dialog)
    await waitFor(() =>
        expect(registerNewApp).toHaveBeenCalledWith(
            'my-amazing-app',
            '',
            false,
            true
        )
    )
    await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    )
    expect(api.getAllApps).toHaveBeenCalledTimes(2)
    expect(api.getAllProjects).toHaveBeenCalledTimes(2)
    expect(
        await screen.findByRole('button', { name: /Create App/ })
    ).toBeInTheDocument()
})

it('retains project and persistence on failure, blocks duplicate submits, and allows retry', async () => {
    const { registerNewApp } = await renderApps(projects)
    let rejectRequest: (error: string) => void = () => undefined
    registerNewApp.mockImplementationOnce(
        () =>
            new Promise((_resolve, reject) => {
                rejectRequest = reject
            })
    )
    const dialog = await openModal()
    expect(
        within(dialog).getByText('root <no parent project>')
    ).toBeInTheDocument()
    fireEvent.mouseDown(within(dialog).getByRole('combobox'))
    fireEvent.click(
        (await screen.findAllByText('Production')).find(
            (node) => node.className === 'ant-select-tree-title'
        ) as HTMLElement
    )
    fireEvent.change(within(dialog).getByLabelText('Application Name'), {
        target: { value: 'database' },
    })
    fireEvent.click(within(dialog).getByRole('checkbox'))
    submitForm(dialog)
    await waitFor(() => expect(registerNewApp).toHaveBeenCalledTimes(1))
    expect(
        within(dialog).getByRole('button', { name: 'Cancel' })
    ).toBeDisabled()
    submitForm(dialog)
    await act(async () => rejectRequest('Creation failed'))
    expect(registerNewApp).toHaveBeenCalledTimes(1)
    expect(Toaster.toastError).toHaveBeenCalledWith('Creation failed')
    expect(within(dialog).getByLabelText('Application Name')).toHaveValue(
        'database'
    )
    expect(within(dialog).getByRole('checkbox')).toBeChecked()
    submitForm(dialog)
    await waitFor(() => expect(registerNewApp).toHaveBeenCalledTimes(2))
    expect(registerNewApp).toHaveBeenLastCalledWith(
        'database',
        'production',
        true,
        true
    )
})

it('resets the fields after canceling and reopening', async () => {
    const { registerNewApp } = await renderApps(projects)
    let dialog = await openModal()
    fireEvent.change(within(dialog).getByLabelText('Application Name'), {
        target: { value: 'discard-me' },
    })
    fireEvent.click(within(dialog).getByRole('checkbox'))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))
    expect(registerNewApp).not.toHaveBeenCalled()
    dialog = await openModal()
    expect(within(dialog).getByLabelText('Application Name')).toHaveValue('')
    expect(within(dialog).getByRole('checkbox')).not.toBeChecked()
    expect(
        within(dialog).getByText('root <no parent project>')
    ).toBeInTheDocument()
})

it('shows the empty state with projects and no applications on mobile', async () => {
    await renderApps(projects, true)
    expect(
        screen.getByText(
            'Create your first application using Create App above.'
        )
    ).toBeInTheDocument()
    const dialog = await openModal()
    expect(within(dialog).getByText('Parent project')).toBeInTheDocument()
})
