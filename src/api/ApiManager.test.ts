describe('ApiManager authentication initialization', () => {
    beforeEach(() => {
        jest.resetModules()
        window.localStorage.clear()
        window.sessionStorage.clear()
    })

    it('restores an authentication token from localStorage', () => {
        const StorageHelper = require('../utils/StorageHelper').default
        StorageHelper.setAuthKeyInLocalStorage('local-token')

        const ApiManager = require('./ApiManager').default

        expect(ApiManager.isLoggedIn()).toBe(true)
    })

    it('restores an authentication token from sessionStorage', () => {
        const StorageHelper = require('../utils/StorageHelper').default
        StorageHelper.setAuthKeyInSessionStorage('session-token')

        const ApiManager = require('./ApiManager').default

        expect(ApiManager.isLoggedIn()).toBe(true)
    })

    it('starts logged out when no authentication token is stored', () => {
        const ApiManager = require('./ApiManager').default

        expect(ApiManager.isLoggedIn()).toBe(false)
    })
})
