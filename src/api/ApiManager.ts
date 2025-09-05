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

    startOneClickDeploy(
        template: any,
        values?: any
    ): Promise<{ jobId: string }> {
        return this.executeGenericApiCommand('POST', '/user/oneclick/deploy', {
            template,
            values,
        })
    }

    getOneClickDeployProgress(jobId: string): Promise<any> {
        return this.executeGenericApiCommand(
            'GET',
            '/user/oneclick/deploy/progress',
            {
                jobId,
            }
        )
    }
}
