import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import App from './App'
import { ThemeProvider } from './styles/theme/ThemeProvider'

jest.mock('./utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
    getCurrentLanguageOption: () => ({ rtl: false }),
}))
jest.mock('./containers/Login', () => () => <div />)
jest.mock('./containers/PageRoot', () => () => <div />)

afterEach(() => {
    jest.restoreAllMocks()
    localStorage.clear()
})

// A separate test file gives startup a fresh App module and themeState.
it('loads the persisted theme and applies its head elements on startup', async () => {
    localStorage.clear()
    localStorage.setItem('CAPROVER_DARK_MODE', 'false')
    const getCurrentTheme = jest
        .spyOn(ThemeProvider.prototype, 'getCurrentTheme')
        .mockResolvedValue({
            theme: {
                name: 'Fixture A',
                content: '{}',
                headEmbed:
                    '<style data-theme-startup="style">.theme-probe { color: green; }</style><link data-theme-startup="font" rel="stylesheet" href="/theme-test.css">',
            },
        })
    const { unmount } = render(<App />)

    await waitFor(() =>
        expect(document.documentElement).toHaveAttribute(
            'data-caprover-theme',
            'fixture-a'
        )
    )
    expect(getCurrentTheme).toHaveBeenCalledTimes(1)
    expect(
        document.head.querySelector('[data-theme-startup="style"]')
    ).toBeInTheDocument()
    expect(
        document.head.querySelector('[data-theme-startup="font"]')
    ).toHaveAttribute('href', '/theme-test.css')

    unmount()
    expect(
        document.head.querySelector('[data-theme-startup]')
    ).not.toBeInTheDocument()
})
