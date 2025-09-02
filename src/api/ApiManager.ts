import CapRoverAPI from 'caprover-api'
import Logger from '../utils/Logger'
import StorageHelper from '../utils/StorageHelper'

const BASE_DOMAIN = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/$/, '')
    : ''
const URL = BASE_DOMAIN
Logger.dev(`API URL: ${URL}`)

const authProvider = {
    authToken: '' as string,
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

    getApiBaseUrl() {
        return URL
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

    // Starts a one-click deploy job on the backend. Sends template and variables to backend for hydration.
    startOneClickDeploy(
        template: any,
        values?: any
    ): Promise<{ jobId: string }> {
        const endpoint = `${URL}/oneclick/deploy`
        return fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ template, values }),
        }).then(async (res) => {
            if (!res.ok) {
                const text = await res.text()
                return Promise.reject(text || res.statusText)
            }
            return res.json()
        })
    }

    // Polls the backend for progress of a one-click deploy job.
    getOneClickDeployProgress(jobId: string): Promise<any> {
        const endpoint = `${URL}/oneclick/deploy/progress?jobId=${encodeURIComponent(
            jobId
        )}`
        return fetch(endpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(async (res) => {
            if (!res.ok) {
                const text = await res.text()
                return Promise.reject(text || res.statusText)
            }
            return res.json()
        })
    }
}
