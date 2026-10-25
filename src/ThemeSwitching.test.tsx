import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useContext } from 'react'
import App from './App'
import CapRoverThemeContext from './contexts/CapRoverThemeContext'
import DarkModeContext from './contexts/DarkModeContext'
import CapRoverTheme from './styles/theme/CapRoverTheme'
import { ThemeProvider } from './styles/theme/ThemeProvider'

const mockThemeA: CapRoverTheme = {
    name: 'Fixture A',
    content: '{ token: { colorPrimary: "#116644" } }',
    headEmbed:
        '<style data-theme-test="a">.theme-probe { color: green; }</style><link data-theme-test="font-a" rel="stylesheet" href="/theme-test.css">',
}
const mockThemeB: CapRoverTheme = {
    name: ' Fixture   B ',
    content: '{ token: { colorPrimary: "#664411" } }',
    headEmbed:
        '<style data-theme-test="b">.theme-probe { color: brown; }</style><meta data-theme-test="meta-b" name="theme-color" content="#664411">',
}

jest.mock('./utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
    getCurrentLanguageOption: () => ({ rtl: false }),
}))
jest.mock('./containers/Login', () => () => <div />)
jest.mock('./containers/PageRoot', () => MockThemeControls)

function MockThemeControls() {
    const { setCapRoverThemeContext } = useContext(CapRoverThemeContext)
    const { isDarkMode, setIsDarkMode } = useContext(DarkModeContext)
    return (
        <div>
            <button onClick={() => setCapRoverThemeContext(mockThemeA)}>
                Use A
            </button>
            <button onClick={() => setCapRoverThemeContext(mockThemeB)}>
                Use B
            </button>
            <button onClick={() => setCapRoverThemeContext(undefined)}>
                Use Default
            </button>
            <button
                onClick={() =>
                    setCapRoverThemeContext({
                        ...mockThemeA,
                        headEmbed:
                            '<style data-theme-test="edited">.theme-probe { color: blue; }</style>',
                    })
                }
            >
                Edit A
            </button>
            <button
                onClick={() =>
                    setCapRoverThemeContext({
                        name: 'No embed',
                        content: '{}',
                    })
                }
            >
                Use no embed
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)}>
                Toggle test mode
            </button>
        </div>
    )
}

beforeEach(() => {
    localStorage.clear()
    localStorage.setItem('CAPROVER_DARK_MODE', 'false')
    jest.spyOn(ThemeProvider.prototype, 'getCurrentTheme').mockResolvedValue({
        theme: mockThemeA,
    })
})
afterEach(() => jest.restoreAllMocks())

it('loads the selected theme and cleans up only its own elements through A → B → A → Default', async () => {
    const unrelated = document.createElement('style')
    document.head.appendChild(unrelated)
    const { unmount } = render(<App />)
    await screen.findByRole('button', { name: 'Use A' })
    await waitFor(() =>
        expect(document.documentElement).toHaveAttribute(
            'data-caprover-theme',
            'fixture-a'
        )
    )
    const firstStyle = document.head.querySelector('[data-theme-test="a"]')
    expect(document.documentElement).toHaveAttribute(
        'data-caprover-dark',
        'false'
    )
    const firstFont = document.head.querySelector('[data-theme-test="font-a"]')
    expect(firstStyle).toBeInTheDocument()
    expect(firstFont).toHaveAttribute('href', '/theme-test.css')

    fireEvent.click(screen.getByRole('button', { name: 'Use B' }))
    expect(document.documentElement).toHaveAttribute(
        'data-caprover-theme',
        'fixture-b'
    )
    expect(firstStyle).not.toBeInTheDocument()
    expect(firstFont).not.toBeInTheDocument()
    expect(
        document.head.querySelector('[data-theme-test="meta-b"]')
    ).toBeInTheDocument()
    expect(unrelated).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use A' }))
    expect(
        document.head.querySelectorAll('[data-theme-test="a"]')
    ).toHaveLength(1)
    expect(
        document.head.querySelectorAll('[data-theme-test="font-a"]')
    ).toHaveLength(1)
    expect(
        document.head.querySelector('[data-theme-test="b"]')
    ).not.toBeInTheDocument()
    expect(
        document.head.querySelector('[data-theme-test="meta-b"]')
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Use Default' }))
    expect(document.documentElement).toHaveAttribute(
        'data-caprover-theme',
        'default'
    )
    expect(
        document.head.querySelector('[data-theme-test]')
    ).not.toBeInTheDocument()
    unmount()
    expect(document.documentElement).not.toHaveAttribute('data-caprover-theme')
    expect(document.documentElement).not.toHaveAttribute('data-caprover-dark')
    expect(unrelated).toBeInTheDocument()
    unrelated.remove()
})

it('updates an edited theme, preserves head elements across mode changes, and cleans up on unmount', async () => {
    const { unmount } = render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Use A' }))
    const style = document.head.querySelector('[data-theme-test="a"]')
    const previousMode =
        document.documentElement.getAttribute('data-caprover-dark')
    fireEvent.click(screen.getByRole('button', { name: 'Toggle test mode' }))
    expect(document.documentElement).toHaveAttribute(
        'data-caprover-dark',
        previousMode === 'true' ? 'false' : 'true'
    )
    expect(document.head.querySelector('[data-theme-test="a"]')).toBe(style)
    expect(
        document.head.querySelectorAll('[data-theme-test="font-a"]')
    ).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Edit A' }))
    expect(style).not.toBeInTheDocument()
    expect(
        document.head.querySelector('[data-theme-test="edited"]')
    ).toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute(
        'data-caprover-theme',
        'fixture-a'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Use no embed' }))
    expect(
        document.head.querySelector('[data-theme-test]')
    ).not.toBeInTheDocument()
    expect(document.documentElement).toHaveAttribute(
        'data-caprover-theme',
        'no-embed'
    )

    fireEvent.click(screen.getByRole('button', { name: 'Use B' }))
    unmount()
    expect(
        document.head.querySelector('[data-theme-test]')
    ).not.toBeInTheDocument()
    expect(document.documentElement).not.toHaveAttribute('data-caprover-theme')
    expect(document.documentElement).not.toHaveAttribute('data-caprover-dark')
})
