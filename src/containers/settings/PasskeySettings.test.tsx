import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import ApiManager from '../../api/ApiManager'
import PasskeySettings from './PasskeySettings'

jest.mock('../../utils/Language', () => ({
    localize: (_key: string, fallback: string) => fallback,
}))
jest.mock('@simplewebauthn/browser', () => ({
    browserSupportsWebAuthn: () => true,
}))

const passkey = {
    id: 'cred-1',
    name: 'MacBook',
    createdAt: '2026-10-30T12:00:00.000Z',
}

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

afterEach(() => jest.restoreAllMocks())

it('lists registered passkeys', async () => {
    jest.spyOn(ApiManager.prototype, 'getPasskeys').mockResolvedValue({
        passkeys: [passkey],
    })

    render(<PasskeySettings isMobile={false} />)

    expect(await screen.findByText('MacBook')).toBeInTheDocument()
    expect(screen.getByText(/never/)).toBeInTheDocument()
})

it('does not start registration without a name and the current password', async () => {
    jest.spyOn(ApiManager.prototype, 'getPasskeys').mockResolvedValue({
        passkeys: [],
    })
    const registerPasskey = jest.spyOn(ApiManager.prototype, 'registerPasskey')

    render(<PasskeySettings isMobile={false} />)
    fireEvent.click(await screen.findByText('Register passkey'))

    expect(registerPasskey).not.toHaveBeenCalled()
})

it('registers a passkey with name and password, then refreshes the list', async () => {
    const getPasskeys = jest
        .spyOn(ApiManager.prototype, 'getPasskeys')
        .mockResolvedValueOnce({ passkeys: [] })
        .mockResolvedValueOnce({ passkeys: [passkey] })
    const registerPasskey = jest
        .spyOn(ApiManager.prototype, 'registerPasskey')
        .mockResolvedValue({ passkey })

    const { container } = render(<PasskeySettings isMobile={false} />)
    await screen.findByText('No passkeys registered.')

    fireEvent.change(screen.getByPlaceholderText('e.g. MacBook'), {
        target: { value: ' MacBook ' },
    })
    fireEvent.change(
        container.querySelector('input[type="password"]') as HTMLInputElement,
        { target: { value: 'secret-password' } }
    )
    fireEvent.click(screen.getByText('Register passkey'))

    await waitFor(() =>
        expect(registerPasskey).toHaveBeenCalledWith(
            'MacBook',
            'secret-password'
        )
    )
    expect(await screen.findByText('MacBook')).toBeInTheDocument()
    expect(getPasskeys).toHaveBeenCalledTimes(2)
})
