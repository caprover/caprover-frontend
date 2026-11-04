const mockExecuteGenericApiCommand = jest.fn()
const mockStartAuthentication = jest.fn()

jest.mock('caprover-api', () => {
    return class {
        authProvider: { onAuthTokenUpdated: (token: string) => void }
        constructor(
            _baseDomain: string,
            authProvider: { onAuthTokenUpdated: (token: string) => void }
        ) {
            this.authProvider = authProvider
        }
        executeGenericApiCommand(...args: unknown[]) {
            return mockExecuteGenericApiCommand(...args)
        }
    }
})

jest.mock('@simplewebauthn/browser', () => ({
    startAuthentication: (...args: unknown[]) =>
        mockStartAuthentication(...args),
    startRegistration: jest.fn(),
}))

describe('ApiManager passkey login', () => {
    beforeEach(() => {
        jest.resetModules()
        window.localStorage.clear()
        window.sessionStorage.clear()
        mockExecuteGenericApiCommand.mockReset()
        mockStartAuthentication.mockReset()
    })

    it('signs the server challenge and stores the returned token', async () => {
        const options = { challenge: 'server-challenge', rpId: 'captain.x' }
        const assertion = { id: 'cred-1', response: {} }
        mockExecuteGenericApiCommand
            .mockResolvedValueOnce(options)
            .mockResolvedValueOnce({ token: 'passkey-token' })
        mockStartAuthentication.mockResolvedValue(assertion)

        const ApiManager = require('./ApiManager').default
        const token = await new ApiManager().loginWithPasskey()

        expect(mockStartAuthentication).toHaveBeenCalledWith({
            optionsJSON: options,
        })
        expect(mockExecuteGenericApiCommand).toHaveBeenNthCalledWith(
            2,
            'POST',
            '/login/passkey/verify',
            { response: assertion, otpToken: undefined }
        )
        expect(token).toBe('passkey-token')
        expect(ApiManager.isLoggedIn()).toBe(true)
    })

    it('stays logged out when the passkey ceremony is cancelled', async () => {
        mockExecuteGenericApiCommand.mockResolvedValueOnce({ challenge: 'c' })
        mockStartAuthentication.mockRejectedValue(new Error('NotAllowedError'))

        const ApiManager = require('./ApiManager').default
        await expect(new ApiManager().loginWithPasskey()).rejects.toThrow(
            'NotAllowedError'
        )
        expect(mockExecuteGenericApiCommand).toHaveBeenCalledTimes(1)
        expect(ApiManager.isLoggedIn()).toBe(false)
    })
})

export {}
