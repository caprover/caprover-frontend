import { fireEvent, render, screen, cleanup } from '@testing-library/react'

jest.mock('../utils/Language', () => ({
    isLanguageEnabled: false,
    languagesOptions: [],
    localize: (_key: string, message: string) => message,
    getCurrentLanguageOption: () => ({
        value: 'en-US',
        rtl: false,
        antdLocale: {},
        messages: {},
    }),
    setCurrentLanguageOption: jest.fn(),
}))

jest.mock('@simplewebauthn/browser', () => ({
    browserSupportsWebAuthn: () => true,
}))

import {
    LOCAL_STORAGE,
    NO_SESSION,
    NormalLoginForm,
    SESSION_STORAGE,
} from './Login'
import StorageHelper, { REMEMBER_ME_OPTION } from '../utils/StorageHelper'

const getRadio = (option: number): HTMLInputElement => {
    const radio = document.querySelector(
        `input[type="radio"][value="${option}"]`
    )
    if (!radio) throw new Error(`Radio option ${option} was not rendered`)
    return radio as HTMLInputElement
}

const openRememberMePanel = () => {
    fireEvent.click(screen.getByText('Remember Me'))
}

const renderLoginForm = (onLoginRequested = jest.fn()) =>
    render(
        <NormalLoginForm hasOtp={false} onLoginRequested={onLoginRequested} />
    )

describe('Remember Me login form', () => {
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
        window.localStorage.clear()
    })

    afterEach(() => {
        cleanup()
    })

    it.each([NO_SESSION, SESSION_STORAGE, LOCAL_STORAGE])(
        'persists option %i immediately when selected',
        (option) => {
            StorageHelper.setRememberMeOptionInLocalStorage(
                option === NO_SESSION ? SESSION_STORAGE : NO_SESSION
            )
            renderLoginForm()
            openRememberMePanel()

            fireEvent.click(getRadio(option))

            expect(StorageHelper.getRememberMeOptionFromLocalStorage()).toBe(
                option
            )
        }
    )

    it('restores the selected option after the form is remounted', () => {
        renderLoginForm()
        openRememberMePanel()
        fireEvent.click(getRadio(LOCAL_STORAGE))
        expect(getRadio(LOCAL_STORAGE).checked).toBe(true)

        cleanup()
        renderLoginForm()
        openRememberMePanel()

        expect(getRadio(LOCAL_STORAGE).checked).toBe(true)
        expect(getRadio(NO_SESSION).checked).toBe(false)
    })

    it.each([
        ['no stored option', undefined],
        ['malformed JSON', '{not-json'],
        ['unknown option', JSON.stringify(99)],
    ])('defaults to NO_SESSION for %s', (_description, storedValue) => {
        if (storedValue !== undefined) {
            window.localStorage.setItem(REMEMBER_ME_OPTION, storedValue)
        }

        renderLoginForm()
        openRememberMePanel()

        expect(getRadio(NO_SESSION).checked).toBe(true)
        expect(getRadio(SESSION_STORAGE).checked).toBe(false)
        expect(getRadio(LOCAL_STORAGE).checked).toBe(false)
    })

    it('submits the currently selected option to the callback', () => {
        const onLoginRequested = jest.fn()
        const { container } = renderLoginForm(onLoginRequested)
        openRememberMePanel()
        fireEvent.click(getRadio(SESSION_STORAGE))

        fireEvent.submit(container.querySelector('form') as HTMLFormElement)

        expect(onLoginRequested).toHaveBeenCalledTimes(1)
        expect(onLoginRequested.mock.calls[0][2]).toBe(SESSION_STORAGE)
    })
})

describe('Passkey login button', () => {
    afterEach(() => {
        cleanup()
        jest.useRealTimers()
    })

    it('starts a passkey login without submitting the password form', () => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2030-01-01T00:00:00Z'))
        window.localStorage.clear()
        const onLoginRequested = jest.fn()
        const onPasskeyLoginRequested = jest.fn()
        render(
            <NormalLoginForm
                hasOtp={false}
                onLoginRequested={onLoginRequested}
                onPasskeyLoginRequested={onPasskeyLoginRequested}
            />
        )

        fireEvent.click(screen.getByText('Sign in with passkey'))

        expect(onPasskeyLoginRequested).toHaveBeenCalledWith('', NO_SESSION)
        expect(onLoginRequested).not.toHaveBeenCalled()
    })

    it('is hidden when no passkey handler is provided', () => {
        renderLoginForm()
        expect(screen.queryByText('Sign in with passkey')).toBeNull()
    })
})
