import CapRoverAPI from 'caprover-api'
import {
    IAppBackupConfig,
    IRcloneRemoteType,
} from '../containers/apps/appDetails/backups/BackupModels'
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

    // ---------------------------------------------------------- app backups
    //
    // These endpoints live in the backend but are not yet part of the
    // published `caprover-api` package, so we reach the base class' HTTP
    // client directly. `http` is declared private on the upstream class; the
    // cast is a deliberate, contained escape hatch until the package exposes
    // these methods.

    private get httpClient(): any {
        return (this as any).http
    }

    getBackupRemotes() {
        const http = this.httpClient
        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/apps/appBackups/remotes', {}))
    }

    createBackupRemote(
        name: string,
        type: IRcloneRemoteType,
        params: { [k: string]: string }
    ) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appBackups/remotes', {
                    name,
                    type,
                    params,
                })
            )
    }

    updateBackupRemote(
        id: string,
        name: string,
        params: { [k: string]: string }
    ) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appBackups/remotes/update', {
                    id,
                    name,
                    params,
                })
            )
    }

    deleteBackupRemote(id: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appBackups/remotes/delete', {
                    id,
                })
            )
    }

    testBackupRemote(id: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appBackups/remotes/test', {
                    id,
                })
            )
    }

    getAppBackupConfig(appName: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/apps/appBackups/${appName}/config`,
                    {}
                )
            )
    }

    setAppBackupConfig(appName: string, config: IAppBackupConfig) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appBackups/${appName}/config`,
                    { config }
                )
            )
    }

    deleteAppBackupConfig(appName: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appBackups/${appName}/config/delete`,
                    {}
                )
            )
    }

    startAppBackup(appName: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appBackups/${appName}/backup`,
                    {}
                )
            )
    }

    startAppRestore(appName: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appBackups/${appName}/restore`,
                    {}
                )
            )
    }

    getAppBackupJobs(appName: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/apps/appBackups/${appName}/jobs`,
                    {}
                )
            )
    }

    getAppBackupJobLog(appName: string, jobId: string) {
        const http = this.httpClient
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/apps/appBackups/${appName}/jobs/${jobId}/log`,
                    {}
                )
            )
    }
}
