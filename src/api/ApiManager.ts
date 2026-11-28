import { startAuthentication, startRegistration } from '@simplewebauthn/browser'
import CapRoverAPI from 'caprover-api'
import { IPasskey } from '../models/IPasskey'
import Logger from '../utils/Logger'
import StorageHelper from '../utils/StorageHelper'

const BASE_DOMAIN = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/$/, '')
    : ''
const URL = BASE_DOMAIN
Logger.dev(`API URL: ${URL}`)

const authProvider = {
    authToken: StorageHelper.getAuthKeyFromStorage(),
    hadEnteredOtp: false as boolean,
    lastKnownPassword: '' as string,
    onAuthTokenRequested: () => {
        return Promise.resolve(authProvider.authToken)
    },
    onCredentialsRequested: () => {
        return ApiManager.getCreds()
    },
    onAuthTokenUpdated: (authToken: string) => {
        authProvider.authToken = authToken
    },
}

export default class ApiManager extends CapRoverAPI {
    constructor() {
        super(URL, authProvider)
    }

    static getCreds() {
        ApiManager.clearAuthKeys()
        setTimeout(() => {
            window.location.href = window.location.href.split('#')[0]
        }, 200)

        return Promise.resolve({
            password: '',
            otpToken: '',
        })
    }

    getApiBaseUrlForDownload() {
        return `${URL}/api/v2`
    }

    static clearAuthKeys() {
        authProvider.authToken = ''
        StorageHelper.clearAuthKeys()
    }

    static isLoggedIn(): boolean {
        return !!authProvider.authToken
    }

    loginAndSavePassword(password: string, otpToken?: string) {
        authProvider.hadEnteredOtp = !!otpToken
        authProvider.lastKnownPassword = password

        return this.login(password, otpToken) //
            .then(() => {
                return authProvider.authToken
            })
            .catch(function (error) {
                authProvider.hadEnteredOtp = false
                authProvider.lastKnownPassword = ''

                return Promise.reject(error)
            })
    }

    loginWithPasskey(otpToken?: string): Promise<string> {
        authProvider.hadEnteredOtp = !!otpToken
        authProvider.lastKnownPassword = ''

        return this.executeGenericApiCommand(
            'POST',
            '/login/passkey/options',
            {}
        )
            .then((optionsJSON) => startAuthentication({ optionsJSON }))
            .then((response) =>
                this.executeGenericApiCommand('POST', '/login/passkey/verify', {
                    response,
                    otpToken,
                })
            )
            .then((data: { token: string }) => {
                authProvider.onAuthTokenUpdated(data.token)
                return authProvider.authToken
            })
            .catch(function (error) {
                authProvider.hadEnteredOtp = false
                return Promise.reject(error)
            })
    }

    getPasskeys(): Promise<{ passkeys: IPasskey[] }> {
        return this.executeGenericApiCommand('GET', '/user/passkeys', {})
    }

    registerPasskey(
        name: string,
        password: string
    ): Promise<{ passkey: IPasskey }> {
        return this.executeGenericApiCommand(
            'POST',
            '/user/passkeys/register/options',
            { password }
        )
            .then((optionsJSON) => startRegistration({ optionsJSON }))
            .then((response) =>
                this.executeGenericApiCommand(
                    'POST',
                    '/user/passkeys/register/verify',
                    { name, password, response }
                )
            )
    }

    deletePasskey(id: string): Promise<void> {
        return this.executeGenericApiCommand('POST', '/user/passkeys/delete', {
            id,
        })
    }
}
