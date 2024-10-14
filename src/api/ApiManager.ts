import { IAppDef } from '../containers/apps/AppDefinition'
import { ICaptainDefinition } from '../models/ICaptainDefinition'
import {
    IProConfig,
    IProFeatures,
    TwoFactorAuthRequest,
    TwoFactorAuthResponse,
} from '../models/IProFeatures'
import { IRegistryInfo } from '../models/IRegistryInfo'
import { IVersionInfo } from '../models/IVersionInfo'
import ProjectDefinition from '../models/ProjectDefinition'
import CapRoverTheme from '../styles/theme/CapRoverTheme'
import ErrorFactory from '../utils/ErrorFactory'
import Logger from '../utils/Logger'
import StorageHelper from '../utils/StorageHelper'
import HttpClient from './HttpClient'

const BASE_DOMAIN = process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace(/\/$/, '')
    : ''
const URL = BASE_DOMAIN + '/api/v2'
Logger.dev(`API URL: ${URL}`)

export default class ApiManager {
    private static lastKnownPassword: string = ''
    private static hadOtp: boolean = false
    private static authToken = StorageHelper.getAuthKeyFromStorage() || ''

    private http: HttpClient

    constructor() {
        const self = this
        this.http = new HttpClient(URL, function () {
            if (!ApiManager.lastKnownPassword || ApiManager.hadOtp) {
                // If we had OTP, we don't want to try to login again because we know it's gonna fail!
                if (!!ApiManager.authToken) {
                    // force logging out
                    self.setAuthToken('')
                    setTimeout(() => {
                        window.location.href =
                            window.location.href.split('#')[0]
                    }, 200)
                }
                return Promise.reject(
                    new Error('No saved password. Ignore if initial call.')
                )
            }
            return self.getAuthToken(ApiManager.lastKnownPassword)
        })
        this.http.setAuthToken(ApiManager.authToken)
    }

    getApiBaseUrl() {
        return URL
    }

    destroy() {
        this.http.destroy()
    }

    static getAuthTokenString() {
        return ApiManager.authToken
    }

    setAuthToken(authToken: string) {
        ApiManager.authToken = authToken
        if (!authToken) StorageHelper.clearAuthKeys()
        this.http.setAuthToken(authToken)
    }

    static isLoggedIn(): boolean {
        return !!ApiManager.authToken
    }

    getAuthToken(password: string, otpToken?: string) {
        const http = this.http
        ApiManager.lastKnownPassword = password
        ApiManager.hadOtp = !!otpToken

        const self = this
        return Promise.resolve() //
            .then(http.fetch(http.POST, '/login', { password, otpToken }))
            .then(function (data) {
                self.setAuthToken(data.token)
            })
            .catch(function (error) {
                // Upon wrong password or back-off error, we force logout the user
                // to avoid getting stuck with wrong password loop
                if (
                    error.captainStatus + '' ===
                        ErrorFactory.STATUS_PASSWORD_BACK_OFF + '' ||
                    error.captainStatus + '' ===
                        ErrorFactory.STATUS_WRONG_PASSWORD + ''
                ) {
                    self.setAuthToken('')
                    ApiManager.lastKnownPassword = ''
                    ApiManager.hadOtp = false
                }

                return Promise.reject(error)
            })
    }

    getAllThemes(): Promise<{ themes: CapRoverTheme[] | undefined }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/themes/all', {}))
    }

    getCurrentTheme(): Promise<{ theme: CapRoverTheme }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/theme/current', {}))
    }

    setCurrentTheme(themeName: string): any {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/setcurrent', {
                    themeName,
                })
            )
    }
    saveTheme(oldName: string, theme: CapRoverTheme): any {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/update', {
                    oldName,
                    name: theme.name,
                    content: theme.content,
                })
            )
    }

    deleteTheme(themeName: string): any {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/themes/delete', {
                    themeName,
                })
            )
    }

    getProFeaturesState(): Promise<{ proFeaturesState: IProFeatures }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/pro/state', {}))
    }

    setProApiKey(apiKey: string): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/pro/apikey', { apiKey: apiKey }))
    }

    getProConfigs(): Promise<{ proConfigs: IProConfig }> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/pro/configs', {}))
    }

    setProConfigs(data: IProConfig): Promise<void> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/pro/configs', { proConfigs: data })
            )
    }

    getOtpStatus(): Promise<TwoFactorAuthResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/pro/otp', {}))
    }

    setOtpStatus(data: TwoFactorAuthRequest): Promise<TwoFactorAuthResponse> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/pro/otp', data))
    }

    getCaptainInfo() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/info', {}))
    }

    updateRootDomain(rootDomain: string, force: boolean) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/changerootdomain', {
                    rootDomain,
                    force,
                })
            )
    }

    enableRootSsl(emailAddress: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/enablessl', {
                    emailAddress,
                })
            )
    }

    forceSsl(isEnabled: boolean) {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, '/user/system/forcessl', { isEnabled }))
    }

    getAllApps() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/apps/appDefinitions', {}))
    }

    getAllProjects() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/projects', {}))
    }

    fetchBuildLogs(appName: string) {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, `/user/apps/appData/${appName}`, {}))
    }

    fetchAppLogsInHex(appName: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.GET,
                    `/user/apps/appData/${appName}/logs?encoding=hex`,
                    {}
                )
            )
    }

    uploadAppData(appName: string, file: File) {
        const http = this.http
        let formData = new FormData()
        formData.append('sourceFile', file)
        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appData/${appName}?detached=1`,
                    formData
                )
            )
    }

    registerProject(selectedProject: ProjectDefinition) {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/register', {
                    ...selectedProject,
                })
            )
    }

    updateProject(project: ProjectDefinition) {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/update', {
                    projectDefinition: project,
                })
            )
    }

    uploadCaptainDefinitionContent(
        appName: string,
        captainDefinition: ICaptainDefinition,
        gitHash: string,
        detached: boolean
    ) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appData/${appName}${
                        detached ? '?detached=1' : ''
                    }`,
                    {
                        captainDefinitionContent:
                            JSON.stringify(captainDefinition),
                        gitHash,
                    }
                )
            )
    }

    updateConfigAndSave(appName: string, appDefinition: IAppDef) {
        let instanceCount = appDefinition.instanceCount
        let captainDefinitionRelativeFilePath =
            appDefinition.captainDefinitionRelativeFilePath
        let envVars = appDefinition.envVars
        let notExposeAsWebApp = appDefinition.notExposeAsWebApp
        let forceSsl = appDefinition.forceSsl
        let websocketSupport = appDefinition.websocketSupport
        let volumes = appDefinition.volumes
        let ports = appDefinition.ports
        let nodeId = appDefinition.nodeId
        let appPushWebhook = appDefinition.appPushWebhook
        let customNginxConfig = appDefinition.customNginxConfig
        let preDeployFunction = appDefinition.preDeployFunction
        let serviceUpdateOverride = appDefinition.serviceUpdateOverride
        let containerHttpPort = appDefinition.containerHttpPort
        let description = appDefinition.description
        let httpAuth = appDefinition.httpAuth
        let appDeployTokenConfig = appDefinition.appDeployTokenConfig
        let tags = appDefinition.tags
        let redirectDomain = appDefinition.redirectDomain
        let projectId = appDefinition.projectId
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/update', {
                    appName: appName,
                    instanceCount: instanceCount,
                    captainDefinitionRelativeFilePath:
                        captainDefinitionRelativeFilePath,
                    notExposeAsWebApp: notExposeAsWebApp,
                    forceSsl: forceSsl,
                    websocketSupport: websocketSupport,
                    volumes: volumes,
                    ports: ports,
                    customNginxConfig: customNginxConfig,
                    appPushWebhook: appPushWebhook,
                    nodeId: nodeId,
                    preDeployFunction: preDeployFunction,
                    serviceUpdateOverride: serviceUpdateOverride,
                    containerHttpPort: containerHttpPort,
                    description: description,
                    httpAuth: httpAuth,
                    envVars: envVars,
                    appDeployTokenConfig: appDeployTokenConfig,
                    tags: tags,
                    redirectDomain: redirectDomain,
                    projectId: projectId,
                })
            )
    }

    renameApp(oldAppName: string, newAppName: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/rename', {
                    oldAppName,
                    newAppName,
                })
            )
    }

    registerNewApp(
        appName: string,
        projectId: string,
        hasPersistentData: boolean,
        detached: boolean
    ) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    `/user/apps/appDefinitions/register${
                        detached ? '?detached=1' : ''
                    }`,
                    {
                        appName,
                        projectId,
                        hasPersistentData,
                    }
                )
            )
    }

    deleteApp(
        appName: string | undefined,
        volumes: string[],
        appNames: string[] | undefined
    ) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/apps/appDefinitions/delete', {
                    appName,
                    volumes,
                    appNames,
                })
            )
    }

    deleteProjects(projectIds: string[]) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/projects/delete', {
                    projectIds,
                })
            )
    }

    enableSslForBaseDomain(appName: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/enablebasedomainssl',
                    {
                        appName,
                    }
                )
            )
    }

    attachNewCustomDomainToApp(appName: string, customDomain: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/customdomain',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    enableSslForCustomDomain(appName: string, customDomain: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/enablecustomdomainssl',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    removeCustomDomain(appName: string, customDomain: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/removecustomdomain',
                    {
                        appName,
                        customDomain,
                    }
                )
            )
    }

    getLoadBalancerInfo() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/loadbalancerinfo', {}))
    }

    getNetDataInfo() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/netdata', {}))
    }

    updateNetDataInfo(netDataInfo: any) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/netdata', { netDataInfo })
            )
    }

    changePass(oldPassword: string, newPassword: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/changepassword', {
                    oldPassword,
                    newPassword,
                })
            )
    }

    getVersionInfo(): Promise<IVersionInfo> {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/versioninfo', {}))
    }

    createBackup(): Promise<{ downloadToken: string }> {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/createbackup', {
                    postDownloadFileName: 'backup.tar',
                })
            )
    }

    performUpdate(latestVersion: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/versioninfo', {
                    latestVersion,
                })
            )
    }

    getNginxConfig() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/nginxconfig', {}))
    }

    setNginxConfig(customBase: string, customCaptain: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/nginxconfig', {
                    baseConfig: { customValue: customBase },
                    captainConfig: { customValue: customCaptain },
                })
            )
    }

    getUnusedImages(mostRecentLimit: number) {
        const http = this.http
        return Promise.resolve() //
            .then(
                http.fetch(http.GET, '/user/apps/appDefinitions/unusedImages', {
                    mostRecentLimit: mostRecentLimit + '',
                })
            )
    }

    deleteImages(imageIds: string[]) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/apps/appDefinitions/deleteImages',
                    {
                        imageIds,
                    }
                )
            )
    }

    getDiskCleanUpSettings() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/diskcleanup', {}))
    }

    setDiskCleanUpSettings(
        mostRecentLimit: number,
        cronSchedule: string,
        timezone: string
    ) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/diskcleanup', {
                    mostRecentLimit,
                    cronSchedule,
                    timezone,
                })
            )
    }

    getDockerRegistries() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/registries', {}))
    }

    enableSelfHostedDockerRegistry() {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/system/selfhostregistry/enableregistry',
                    {}
                )
            )
    }

    disableSelfHostedDockerRegistry() {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(
                    http.POST,
                    '/user/system/selfhostregistry/disableregistry',
                    {}
                )
            )
    }

    addDockerRegistry(dockerRegistry: IRegistryInfo) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/insert', {
                    ...dockerRegistry,
                })
            )
    }

    updateDockerRegistry(dockerRegistry: IRegistryInfo) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/update', {
                    ...dockerRegistry,
                })
            )
    }

    deleteDockerRegistry(registryId: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/delete', {
                    registryId,
                })
            )
    }

    setDefaultPushDockerRegistry(registryId: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/registries/setpush', {
                    registryId,
                })
            )
    }

    forceBuild(webhookPath: string) {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.POST, webhookPath, {}))
    }

    getAllNodes() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/system/nodes', {}))
    }

    getAllOneClickApps() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/oneclick/template/list', {}))
    }

    getOneClickAppByName(appName: string, baseDomain: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.GET, '/user/oneclick/template/app', {
                    appName,
                    baseDomain,
                })
            )
    }

    getAllOneClickAppRepos() {
        const http = this.http

        return Promise.resolve() //
            .then(http.fetch(http.GET, '/user/oneclick/repositories', {}))
    }

    addNewCustomOneClickRepo(repositoryUrl: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/oneclick/repositories/insert', {
                    repositoryUrl,
                })
            )
    }

    deleteCustomOneClickRepo(repositoryUrl: string) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/oneclick/repositories/delete', {
                    repositoryUrl,
                })
            )
    }

    addDockerNode(
        nodeType: string,
        privateKey: string,
        remoteNodeIpAddress: string,
        sshPort: string,
        sshUser: string,
        captainIpAddress: string
    ) {
        const http = this.http

        return Promise.resolve() //
            .then(
                http.fetch(http.POST, '/user/system/nodes', {
                    nodeType,
                    privateKey,
                    remoteNodeIpAddress,
                    sshPort,
                    sshUser,
                    captainIpAddress,
                })
            )
    }
}
