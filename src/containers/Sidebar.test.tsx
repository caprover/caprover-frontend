import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import Sidebar from './Sidebar'

jest.mock('../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
    getCurrentLanguageOption: () => ({ rtl: false }),
}))
jest.mock('./global/LanguageSelector', () => () => <div>Language selector</div>)
jest.mock('./global/DarkModeSwitch', () => () => <button>Color mode</button>)

const renderSidebar = (isMobile = false, collapsed = false) => {
    const history = { push: jest.fn() }
    const toggleSider = jest.fn()
    const onLogoutClicked = jest.fn()
    render(
        <Sidebar
            isMobile={isMobile}
            collapsed={collapsed}
            toggleSider={toggleSider}
            onLogoutClicked={onLogoutClicked}
            location={{ pathname: '/apps/details/api' }}
            history={history}
        />
    )
    return { history, toggleSider, onLogoutClicked }
}

it('selects the active section on nested routes and keeps navigation direct', () => {
    const { history } = renderSidebar()
    expect(screen.getByRole('menuitem', { name: 'Apps' })).toHaveClass(
        'ant-menu-item-selected'
    )
    fireEvent.click(screen.getByRole('menuitem', { name: 'Monitoring' }))
    expect(history.push).toHaveBeenCalledWith('/monitoring')
})

it('keeps language selection accessible from the sidebar', async () => {
    renderSidebar()
    fireEvent.click(screen.getByRole('button', { name: 'Language' }))
    expect(await screen.findByRole('dialog')).toHaveTextContent(
        'Language selector'
    )
})

it('opens mobile navigation in a dismissible drawer', () => {
    const { toggleSider, history } = renderSidebar(true)
    expect(screen.getByRole('dialog')).toHaveTextContent('Navigation')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Settings' }))
    expect(history.push).toHaveBeenCalledWith('/settings')
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(toggleSider).toHaveBeenCalledTimes(1)
})
