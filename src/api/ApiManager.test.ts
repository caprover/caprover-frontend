type TestAuthProvider = {
    onAuthTokenRequested: () => Promise<string>
}

let mockAuthProvider: TestAuthProvider | undefined

jest.mock('caprover-api', () => {
    return class {
        constructor(
            _baseDomain: string,
            authProvider: TestAuthProvider
        ) {
            mockAuthProvider = authProvider
        }
    }
})

const loadApiManager = () => {
    const ApiManager = require('./ApiManager').default
    new ApiManager()
    return ApiManager
}

describe('ApiManager authentication initialization', () => {
    beforeEach(() => {
        jest.resetModules()
        window.localStorage.clear()
        window.sessionStorage.clear()
        mockAuthProvider = undefined
    })

    it('restores an authentication token from localStorage', async () => {
        const StorageHelper = require('../utils/StorageHelper').default
        StorageHelper.setAuthKeyInLocalStorage('local-token')

        const ApiManager = loadApiManager()

        expect(ApiManager.isLoggedIn()).toBe(true)
        expect(await mockAuthProvider!.onAuthTokenRequested()).toBe(
            'local-token'
        )
    })

    it('restores an authentication token from sessionStorage', async () => {
        const StorageHelper = require('../utils/StorageHelper').default
        StorageHelper.setAuthKeyInSessionStorage('session-token')

        const ApiManager = loadApiManager()

        expect(ApiManager.isLoggedIn()).toBe(true)
        expect(await mockAuthProvider!.onAuthTokenRequested()).toBe(
            'session-token'
        )
    })

    it('starts logged out when no authentication token is stored', async () => {
        const ApiManager = loadApiManager()

        expect(ApiManager.isLoggedIn()).toBe(false)
        expect(await mockAuthProvider!.onAuthTokenRequested()).toBe('')
    })
})

export {}
