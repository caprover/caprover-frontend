import { IAppDef } from "../containers/apps/AppDefinition";
import { ICaptainDefinition } from "../models/ICaptainDefinition";
import { IRegistryInfo } from "../models/IRegistryInfo";
import { IVersionInfo } from "../models/IVersionInfo";
import Logger from "../utils/Logger";
import StorageHelper from "../utils/StorageHelper";
import HttpClient from "./HttpClient";

const BASE_DOMAIN = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL
  : "";
const URL = BASE_DOMAIN + "/api/v2";
Logger.dev("API URL: " + URL);

export default class ApiManager {
  private static lastKnownPassword: string = process.env
    .REACT_APP_DEFAULT_PASSWORD
    ? process.env.REACT_APP_DEFAULT_PASSWORD + ""
    : "captain42";
  private static authToken = StorageHelper.getAuthKeyFromStorage() || "";

  private http: HttpClient;

  constructor() {
    const self = this;
    this.http = new HttpClient(URL, ApiManager.authToken, function() {
      return self.getAuthToken(ApiManager.lastKnownPassword);
    });
  }

  getApiBaseUrl() {
    return URL;
  }

  destroy() {
    this.http.destroy();
  }

  static getAuthTokenString() {
    return ApiManager.authToken;
  }

  setAuthToken(authToken: string) {
    ApiManager.authToken = authToken;
    if (!authToken) StorageHelper.clearAuthKeys();
    this.http.setAuthToken(authToken);
  }

  static isLoggedIn() {
    return !!ApiManager.authToken;
  }

  getAuthToken(password: string) {
    const http = this.http;
    ApiManager.lastKnownPassword = password;

    const self = this;
    return Promise.resolve() //
      .then(http.fetch(http.POST, "/login", { password }))
      .then(function(data) {
        self.setAuthToken(data.token);
      });
  }

  getCaptainInfo() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/system/info", {}));
  }

  updateRootDomain(rootDomain: string, force: boolean) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/system/changerootdomain", {
          rootDomain,
          force
        })
      );
  }

  enableRootSsl(emailAddress: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.POST, "/user/system/enablessl", { emailAddress }));
  }

  forceSsl(isEnabled: boolean) {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.POST, "/user/system/forcessl", { isEnabled }));
  }

  getAllApps() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/apps/appDefinitions", {}));
  }

  fetchBuildLogs(appName: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/apps/appData/" + appName, {}));
  }

  fetchAppLogsInHex(appName: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(
          http.GET,
          `/user/apps/appData/${appName}/logs?encoding=hex`,
          {}
        )
      );
  }

  uploadAppData(appName: string, file: File) {
    const http = this.http;
    var formData = new FormData();
    formData.append("sourceFile", file);
    return Promise.resolve() //
      .then(
        http.fetch(
          http.POST,
          "/user/apps/appData/" + appName + "?detached=1",
          formData
        )
      );
  }

  uploadCaptainDefinitionContent(
    appName: string,
    captainDefinition: ICaptainDefinition,
    gitHash: string,
    detached: boolean
  ) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(
          http.POST,
          "/user/apps/appData/" + appName + (detached ? "?detached=1" : ""),
          {
            captainDefinitionContent: JSON.stringify(captainDefinition),
            gitHash
          }
        )
      );
  }

  updateConfigAndSave(appName: string, appDefinition: IAppDef) {
    var instanceCount = appDefinition.instanceCount;
    var captainDefinitionRelativeFilePath =
      appDefinition.captainDefinitionRelativeFilePath;
    var envVars = appDefinition.envVars;
    var notExposeAsWebApp = appDefinition.notExposeAsWebApp;
    var forceSsl = appDefinition.forceSsl;
    var websocketSupport = appDefinition.websocketSupport;
    var volumes = appDefinition.volumes;
    var ports = appDefinition.ports;
    var nodeId = appDefinition.nodeId;
    var appPushWebhook = appDefinition.appPushWebhook;
    var customNginxConfig = appDefinition.customNginxConfig;
    var preDeployFunction = appDefinition.preDeployFunction;
    var containerHttpPort = appDefinition.containerHttpPort;
    var description = appDefinition.description;
    var httpAuth = appDefinition.httpAuth;
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/update", {
          appName: appName,
          instanceCount: instanceCount,
          captainDefinitionRelativeFilePath: captainDefinitionRelativeFilePath,
          notExposeAsWebApp: notExposeAsWebApp,
          forceSsl: forceSsl,
          websocketSupport: websocketSupport,
          volumes: volumes,
          ports: ports,
          customNginxConfig: customNginxConfig,
          appPushWebhook: appPushWebhook,
          nodeId: nodeId,
          preDeployFunction: preDeployFunction,
          containerHttpPort: containerHttpPort,
          description: description,
          httpAuth: httpAuth,
          envVars: envVars
        })
      );
  }

  renameApp(oldAppName: string, newAppName: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/rename", {
          oldAppName,
          newAppName
        })
      );
  }

  registerNewApp(
    appName: string,
    hasPersistentData: boolean,
    detached: boolean
  ) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(
          http.POST,
          "/user/apps/appDefinitions/register" +
            (detached ? "?detached=1" : ""),
          {
            appName,
            hasPersistentData
          }
        )
      );
  }

  deleteApp(appName: string, volumes: string[]) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/delete", {
          appName,
          volumes
        })
      );
  }

  enableSslForBaseDomain(appName: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/enablebasedomainssl", {
          appName
        })
      );
  }

  attachNewCustomDomainToApp(appName: string, customDomain: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/customdomain", {
          appName,
          customDomain
        })
      );
  }

  enableSslForCustomDomain(appName: string, customDomain: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(
          http.POST,
          "/user/apps/appDefinitions/enablecustomdomainssl",
          {
            appName,
            customDomain
          }
        )
      );
  }

  removeCustomDomain(appName: string, customDomain: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/removecustomdomain", {
          appName,
          customDomain
        })
      );
  }

  getLoadBalancerInfo() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/system/loadbalancerinfo", {}));
  }

  getNetDataInfo() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/system/netdata", {}));
  }

  updateNetDataInfo(netDataInfo: any) {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.POST, "/user/system/netdata", { netDataInfo }));
  }

  changePass(oldPassword: string, newPassword: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/changepassword", {
          oldPassword,
          newPassword
        })
      );
  }

  getVersionInfo(): Promise<IVersionInfo> {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/system/versioninfo", {}));
  }

  createBackup(): Promise<{ downloadToken: string }> {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/system/createbackup", {
          postDownloadFileName: "backup.tar"
        })
      );
  }

  performUpdate(latestVersion: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/system/versioninfo", { latestVersion })
      );
  }

  getNginxConfig() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/system/nginxconfig", {}));
  }

  setNginxConfig(customBase: string, customCaptain: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/system/nginxconfig", {
          baseConfig: { customValue: customBase },
          captainConfig: { customValue: customCaptain }
        })
      );
  }

  getUnusedImages(mostRecentLimit: number) {
    const http = this.http;
    return Promise.resolve() //
      .then(
        http.fetch(http.GET, "/user/apps/appDefinitions/unusedImages", {
          mostRecentLimit: mostRecentLimit + ""
        })
      );
  }

  deleteImages(imageIds: string[]) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/apps/appDefinitions/deleteImages", {
          imageIds
        })
      );
  }

  getDockerRegistries() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/registries", {}));
  }

  enableSelfHostedDockerRegistry() {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(
          http.POST,
          "/user/system/selfhostregistry/enableregistry",
          {}
        )
      );
  }

  disableSelfHostedDockerRegistry() {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(
          http.POST,
          "/user/system/selfhostregistry/disableregistry",
          {}
        )
      );
  }

  addDockerRegistry(dockerRegistry: IRegistryInfo) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/registries/insert", { ...dockerRegistry })
      );
  }

  updateDockerRegistry(dockerRegistry: IRegistryInfo) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/registries/update", { ...dockerRegistry })
      );
  }

  deleteDockerRegistry(registryId: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/registries/delete", {
          registryId
        })
      );
  }

  setDefaultPushDockerRegistry(registryId: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/registries/setpush", {
          registryId
        })
      );
  }

  forceBuild(webhookPath: string) {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.POST, webhookPath, {}));
  }

  getAllNodes() {
    const http = this.http;

    return Promise.resolve() //
      .then(http.fetch(http.GET, "/user/system/nodes", {}));
  }

  addDockerNode(
    nodeType: string,
    privateKey: string,
    remoteNodeIpAddress: string,
    captainIpAddress: string
  ) {
    const http = this.http;

    return Promise.resolve() //
      .then(
        http.fetch(http.POST, "/user/system/nodes", {
          nodeType,
          privateKey,
          remoteNodeIpAddress,
          captainIpAddress
        })
      );
  }
}
