import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'
import { SetupStatus } from '../models/SetupStatus'
import StorageHelper from '../utils/StorageHelper'
import Utils from '../utils/Utils'
import { PageRoot } from './PageRoot'

jest.mock('../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
    getCurrentLanguageOption: () => ({ rtl: false }),
}))
jest.mock('../api/ApiManager', () => ({
    __esModule: true,
    default: class {
        static isLoggedIn() {
            return true
        }
        getVersionInfo() {
            return Promise.resolve({ canUpdate: true })
        }
        destroy() {}
    },
}))
jest.mock('./settings/Settings', () => () => <div>Settings page</div>)
jest.mock('./maintenance/Maintenance', () => () => <div />)
jest.mock('./apps/oneclick/variables/OneClickAppConfigPage', () => () => (
    <div />
))
jest.mock('./apps/oneclick/variables/OneClickDeploymentPage', () => () => (
    <div />
))
jest.mock('./monitoring/DiskUsageAlertContainer', () => () => <div />)

const renderPage = () => {
    const history = createMemoryHistory({ initialEntries: ['/settings'] })
    const page = (isMobile: boolean) => (
        <Router history={history}>
            <PageRoot
                history={history}
                location={history.location}
                match={{
                    path: '/settings',
                    url: '/settings',
                    isExact: true,
                    params: {},
                }}
                rootElementKey="root"
                setupStatus={SetupStatus.Required}
                setupDismissed={false}
                refreshSetup={jest.fn()}
                emitSizeChanged={jest.fn()}
                isMobile={isMobile}
            />
        </Router>
    )
    const result = render(page(false))
    return {
        ...result,
        resize: (isMobile: boolean) => result.rerender(page(isMobile)),
    }
}

beforeEach(() => {
    localStorage.clear()
    jest.spyOn(Utils, 'isMobile').mockReturnValue(false)
})
afterEach(() => jest.restoreAllMocks())

it('shows a prominent update action when an update is available', async () => {
    renderPage()

    expect(
        await screen.findByRole('button', { name: 'Update available' })
    ).toHaveClass('update-available-button')
})

it.each([false, true])(
    'preserves the desktop sidebar preference through mobile mode (collapsed: %s)',
    async (collapsed) => {
        StorageHelper.setSiderCollapsedStateInLocalStorage(collapsed)
        const { container, resize } = renderPage()
        await waitFor(() =>
            expect(
                container.querySelector('.ant-layout-sider-collapsed') !== null
            ).toBe(collapsed)
        )
        resize(true)
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        fireEvent.click(
            screen.getByRole('button', { name: 'Toggle navigation' })
        )
        expect(await screen.findByRole('dialog')).toHaveTextContent(
            'Navigation'
        )
        expect(StorageHelper.getSiderCollapsedStateFromLocalStorage()).toBe(
            collapsed
        )
        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
        expect(StorageHelper.getSiderCollapsedStateFromLocalStorage()).toBe(
            collapsed
        )
        resize(false)
        expect(
            container.querySelector('.ant-layout-sider-collapsed') !== null
        ).toBe(collapsed)
        fireEvent.click(
            screen.getByRole('button', { name: 'Toggle navigation' })
        )
        expect(StorageHelper.getSiderCollapsedStateFromLocalStorage()).toBe(
            !collapsed
        )
    }
)
