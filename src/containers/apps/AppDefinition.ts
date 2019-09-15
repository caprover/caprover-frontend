//COPIED FROM BACKEND CODE
interface IHashMapGeneric<T> {
  [id: string]: T;
}

type IAllAppDefinitions = IHashMapGeneric<IAppDef>;

export interface IAppEnvVar {
  key: string;
  value: string;
}

export interface IAppVolume {
  containerPath: string;
  volumeName?: string;
  hostPath?: string;
}

export interface IAppPort {
  containerPort: number;
  hostPort: number;
  protocol?: "udp" | "tcp";

  publishMode?: "ingress" | "host";
}

export interface RepoInfo {
  repo: string;
  branch: string;
  user: string;
  sshKey: string;
  password: string;
}

interface RepoInfoEncrypted {
  repo: string;
  branch: string;
  user: string;
  sshKeyEncrypted: string;
  passwordEncrypted: string;
}

export interface IAppVersion {
  version: number;
  deployedImageName?: string; // empty if the deploy is not completed
  timeStamp: string;
  gitHash: string | undefined;
}

export interface IAppCustomDomain {
  publicDomain: string;
  hasSsl: boolean;
}

export interface IHttpAuth {
  user: string
  password?: string
  passwordHashed?: string
}

interface IAppDefinitionBase {
  description?: string;
  deployedVersion: number;
  notExposeAsWebApp: boolean;
  hasPersistentData: boolean;
  hasDefaultSubDomainSsl: boolean;
  containerHttpPort: number;
  httpAuth?: IHttpAuth;
  captainDefinitionRelativeFilePath: string;

  forceSsl: boolean;
  websocketSupport: boolean;
  nodeId?: string;
  instanceCount: number;
  preDeployFunction?: string;
  customNginxConfig?: string;
  networks: string[];
  customDomain: IAppCustomDomain[];

  ports: IAppPort[];
  volumes: IAppVolume[];
  envVars: IAppEnvVar[];

  versions: IAppVersion[];
}

export interface IAppDef extends IAppDefinitionBase {
  appPushWebhook?: {
    repoInfo: RepoInfo;
    tokenVersion?: string; // On FrontEnd, these values are null, until they are assigned.
    pushWebhookToken?: string; // On FrontEnd, these values are null, until they are assigned.
  };
  appName?: string;
  isAppBuilding?: boolean;
}

interface IAppDefSaved extends IAppDefinitionBase {
  appPushWebhook:
    | {
        tokenVersion: string;
        repoInfo: RepoInfoEncrypted;
        pushWebhookToken: string;
      }
    | undefined;
}
