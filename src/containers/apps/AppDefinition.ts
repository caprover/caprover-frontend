// COPIED FROM BACKEND CODE
interface IHashMapGeneric<T> {
    [id: string]: T
}

type IAllAppDefinitions = IHashMapGeneric<IAppDef>

export interface IAppEnvVar {
    key: string
    value: string
}

interface IAppVolume {
    containerPath: string
    volumeName?: string
    hostPath?: string
}

interface IAppPort {
    containerPort: number
    hostPort: number
    protocol?: 'udp' | 'tcp'

    publishMode?: 'ingress' | 'host'
}

export interface RepoInfo {
    repo: string
    branch: string
    user: string
    sshKey: string
    password: string
}

interface RepoInfoEncrypted {
    repo: string
    branch: string
    user: string
    sshKeyEncrypted: string
    passwordEncrypted: string
}

export interface IAppVersion {
    version: number
    deployedImageName?: string // empty if the deploy is not completed
    timeStamp: string
    gitHash: string | undefined
}

interface IAppCustomDomain {
    publicDomain: string
    hasSsl: boolean
}

interface IAppTag {
    tagName: string
}

interface IAppDefinitionBase {
    description?: string
    deployedVersion: number
    notExposeAsWebApp: boolean
    hasPersistentData: boolean
    hasDefaultSubDomainSsl: boolean
    containerHttpPort: number
    httpAuth?: {
        user: string
        password?: string
        passwordHashed?: string
    }
    captainDefinitionRelativeFilePath: string

    forceSsl: boolean
    websocketSupport: boolean
    nodeId?: string
    instanceCount: number
    preDeployFunction?: string
    serviceUpdateOverride?: string
    customNginxConfig?: string
    redirectDomain?: string
    networks: string[]
    customDomain: IAppCustomDomain[]
    tags?: IAppTag[]
    ports: IAppPort[]
    volumes: IAppVolume[]
    envVars: IAppEnvVar[]

    versions: IAppVersion[]
    appDeployTokenConfig?: AppDeployTokenConfig
}

interface AppDeployTokenConfig {
    enabled: boolean
    appDeployToken?: string
}

export interface IAppDef extends IAppDefinitionBase {
    appPushWebhook?: {
        repoInfo: RepoInfo
        tokenVersion?: string // On FrontEnd, these values are null, until they are assigned.
        pushWebhookToken?: string // On FrontEnd, these values are null, until they are assigned.
    }
    appName?: string
    isAppBuilding?: boolean
}

interface IAppDefSaved extends IAppDefinitionBase {
    appPushWebhook:
        | {
              tokenVersion: string
              repoInfo: RepoInfoEncrypted
              pushWebhookToken: string
          }
        | undefined
}
