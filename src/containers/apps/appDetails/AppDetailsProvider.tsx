import React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import ApiComponent from "../../global/ApiComponent";
import { LogFetcher } from "./AppDetailsService";
import Toaster from "../../../utils/Toaster";
import { IAppDef, IAppVersion, IBuildLogs } from "../AppDefinition";
import ErrorFactory from "../../../utils/ErrorFactory";

export interface AppLogs {
  appLogs?: string;
  buildLogs?: IBuildLogs;
}

export interface AppDetailsState {
  building: boolean;
  appDefinition?: IAppDef;
  rootDomain?: string;
  defaultNginxConfig?: string;
  isDirty: boolean;
  isMobile: boolean;
  appData: {
    isLoading: boolean;
  };
  logs: AppLogs;
}

export interface AppDetailsContext extends AppDetailsState{
  enableSslForBaseDomain(): Promise<void>;
  enableSslForCustomDomain(name: string): Promise<void>;
  removeCustomDomain(name: string): Promise<void>;
  addCustomDomain(name: string): Promise<void>;
  updateAppDefintion(update: Partial<IAppDef>): void;
  save(): Promise<void>;
  fetchAppData(): Promise<IAppDef | undefined>;
  deleteApp(name: string, volumes: string[]): Promise<AppDeleteResponse | undefined>;
  renameApp(name: string): Promise<void>;
  forceBuild(token: string): Promise<void>;
  uploadCaptainDefinitionContent(content: string): Promise<void>;
  uploadAppData(file: File): Promise<void>;
  rollbackToVersion(version: IAppVersion): Promise<void>;
  currentApp(): SingleAppApiData;
}

export interface AppDeleteResponse {
  data: {
    volumesFailedToDelete?: string[];
  };
}

export interface SingleAppApiData {
  app: IAppDef;
  appName: string;
  rootDomain: string;
}

interface AppDetailsProviderProps extends RouteComponentProps<{ appName: string }> {
  isMobile: boolean;
}

export const AppDetailsContext = React.createContext<AppDetailsContext>({} as AppDetailsContext);

class AppDetailsProvider extends ApiComponent<AppDetailsProviderProps, AppDetailsContext> {
  logfetcher?: LogFetcher;

  constructor(props: AppDetailsProviderProps) {
    super(props);

    this.state = {
      building: false,
      appDefinition: undefined,
      rootDomain: undefined,
      defaultNginxConfig: undefined,
      isDirty: true,
      appData: {
        isLoading: true,
      },
      logs: {
        appLogs: undefined,
        buildLogs: undefined,
      },
      isMobile: props.isMobile,

      // wire up all the public methods on the context
      updateAppDefintion: this.updateAppDefintion.bind(this),
      fetchAppData: this.fetchAppData.bind(this),
      save: this.save.bind(this),
      addCustomDomain: this.addCustomDomain.bind(this),
      removeCustomDomain: this.removeCustomDomain.bind(this),
      enableSslForCustomDomain: this.enableSslForCustomDomain.bind(this),
      enableSslForBaseDomain: this.enableSslForBaseDomain.bind(this),
      rollbackToVersion: this.rollbackToVersion.bind(this),
      uploadAppData: this.uploadAppData.bind(this),
      uploadCaptainDefinitionContent: this.uploadCaptainDefinitionContent.bind(this),
      forceBuild: this.forceBuild.bind(this),
      renameApp: this.renameApp.bind(this),
      deleteApp: this.deleteApp.bind(this),
      currentApp: this.currentApp.bind(this),
    };
  }

  /* lifecycle */

  static getDerivedStateFromProps(props: AppDetailsProviderProps, state: AppDetailsContext) {
    if (props.isMobile !== state.isMobile) {
      return {
        ...state,
        isMobile: props.isMobile,
      };
    }

    return state;
  }

  componentWillUnmount() {
    if (this.logfetcher) {
      this.logfetcher.destroy();
    }

    this.apiManager.destroy();
  }

  asyncSetState = async (state: Partial<AppDetailsState>) => new Promise((resolve) => this.setState(state as AppDetailsState, resolve))

  /* getters */

  get appName(): string {
    return this.currentApp().appName;
  }

  currentApp(): SingleAppApiData {
    if (!this.state.appDefinition ||
      !this.state.appDefinition.appName ||
      !this.state.rootDomain
    ) {
      throw new Error("Missing app data");
    }

    return {
      app: this.state.appDefinition,
      appName: this.state.appDefinition.appName,
      rootDomain: this.state.rootDomain,
    };
  }

  /* modify the app */

  async deleteApp(appName: string, volumes: string[]) {
    this.setState({ appData: { isLoading: true } });
    if (this.logfetcher) {
      this.logfetcher.destroy();
    }

    try {
      const response = await this.apiManager.deleteApp(appName, volumes);
      return response && response.data && response.data.volumesFailedToDelete
        ? response
        : undefined;
    } catch(err) {
      // turn loading to off and bubble the error
      this.setState({ appData: { isLoading: false } });
      throw err;
    }
  }

  async renameApp(newName: string) {
    this.setState({ appData: { isLoading: true } });
    if (this.logfetcher) {
      this.logfetcher.destroy();
    }

    try {
      await this.apiManager.renameApp(
        this.appName,
        newName
      );
      this.props.history.replace(`/apps/details/${newName}`);
      await this.fetchAppData();
    } catch(err) {
      // turn loading to off and bubble the error
      this.setState({ appData: { isLoading: false } });
      throw err;
    }
  }

  /* get app data */

  async fetchAppData(): Promise<IAppDef | undefined> {
    this.setState({ appData: { isLoading: true }});
    const allApps = await this.apiManager.getAllApps();
    this.setState({ appData: { isLoading: false }});

    const myApp: IAppDef = allApps.appDefinitions
      .find((app: IAppDef) => app.appName === this.props.match.params.appName );

    if (myApp && myApp.appName) {
      if (!this.state.appDefinition ||
        (myApp.appName !== this.state.appDefinition.appName) ||
        !this.logfetcher ||
        !this.logfetcher.started
      ) {
        this.startLogFetcher(myApp.appName);
      }

      this.setState({
        appDefinition: myApp,
        rootDomain: allApps.rootDomain,
        defaultNginxConfig: allApps.defaultNginxConfig,
        appData: {
          isLoading: false,
        },
      });

      return myApp;
    }

    return undefined;
  }

  async updateBuildVersionsWithoutLoad() {
    try {
      const apps = await this.apiManager.getAllApps();
      const myApp = apps.appDefinitions.find((app: IAppDef) => app.appName === this.appName);

      if (myApp) {
        this.setState({
          building: false,
          appDefinition: {
            ...this.currentApp().app,
            deployedVersion: myApp.deployedVersion,
            versions: myApp.versions,
          },
        });
      } else {
        throw new Error("app not found!");
      }
    }
    catch (err) {
      Toaster.toast(err);
    }
  }

  /* fire builds */

  async uploadCaptainDefinitionContent(content: string) {
    let json;
    try {
      json = JSON.parse(content);
    } catch(err) {
      throw ErrorFactory.createError(
        ErrorFactory.UNKNOWN_ERROR,
        "Invalid JSON!"
      );
    }

    await this.apiManager.uploadCaptainDefinitionContent(
      this.appName,
      json,
      "",
      true
    );

    this.setState({ building: true });
  }

  async rollbackToVersion(version: IAppVersion) {
    // wait for the call to be successful before setting our build state
    await this.apiManager
      .uploadCaptainDefinitionContent(
        this.appName,
        {
          schemaVersion: 2,
          // We should use imageName, but since imageName does not report build failure (since there is no build!)
          // If we use that, and the image is not available, the service will not work.
          dockerfileLines: ["FROM " + version.deployedImageName],
        },
        version.gitHash || "",
        true
      );

    this.setState({ building: true });
  }

  async forceBuild(webhook: string) {
    await this.apiManager.forceBuild(webhook);
    this.setState({ building: true });
  }

  onLogsFetched = (logs?: { buildLogs?: IBuildLogs; appLogs?: string }, error?: Error) => {
    if (error) {
      Toaster.toast(error);
    }

    if (logs) {
      // set our building state if we're meant to be building
      if (!this.state.building && logs.buildLogs && logs.buildLogs.isAppBuilding) {
        this.setState({ building: true });
      }

      // see if a build is done
      if (logs.buildLogs &&
        !logs.buildLogs.isAppBuilding &&
        this.state.building) {
        // if we stopped building, reload version
        this.updateBuildVersionsWithoutLoad();
      }

      this.setState({ logs });
    }
  }

  startLogFetcher(name: string) {
    if (this.logfetcher) {
      this.logfetcher.destroy();
    }

    this.logfetcher = new LogFetcher(this.apiManager, name, this.onLogsFetched);
    this.logfetcher.start();
  }

  /* settings */

  async save() {
    try {
      return await this.callApiWithRefetch(
        () => this.apiManager.updateConfigAndSave(
          this.appName,
          this.currentApp().app
        )
      );
    } catch (err) {
      Toaster.toast(err);
    }
  }

  // a version of copy that preserves undefined
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deepCopy(obj: any): any {
    if(typeof obj !== "object" || obj === null) {
      return obj;
    }

    if(obj instanceof Date) {
      return new Date(obj.getTime());
    }

    if(obj instanceof Array) {
      return obj.reduce((arr, item, i) => {
        arr[i] = this.deepCopy(item);
        return arr;
      }, []);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.keys(obj).reduce((newObj: any, key) => {
      newObj[key] = this.deepCopy(obj[key]);
      return newObj;
    }, {});
  }

  updateAppDefintion(update: Partial<IAppDef>) {
    return this.asyncSetState({
      isDirty: true,
      appDefinition: {
        ...this.currentApp().app,
        ...this.deepCopy(update),
      }});
  }

  async uploadAppData(data: File) {
    await this.apiManager.uploadAppData(
      this.appName,
      data
    );
    this.setState({ building: true });
  }

  async callApiWithRefetch(call: Function) {
    this.setState({ appData: { isLoading: true } });

    try {
      // do the call
      await call();

      // refetch the data
      await this.fetchAppData();
    } catch(err) {
      // turn loading to off and bubble the error
      this.setState({ appData: { isLoading: false } });
      throw err;
    }
  }

  addCustomDomain(name: string) {
    return this.callApiWithRefetch(
      () => this.apiManager.attachNewCustomDomainToApp(
        this.appName,
        name
      )
    );
  }

  removeCustomDomain(name: string) {
    return this.callApiWithRefetch(
      () => this.apiManager.removeCustomDomain(
        this.appName,
        name
      )
    );
  }

  enableSslForCustomDomain(name: string) {
    return this.callApiWithRefetch(
      () => this.apiManager.enableSslForCustomDomain(
        this.appName,
        name
      )
    );
  }

  enableSslForBaseDomain() {
    return this.callApiWithRefetch(
      () => this.apiManager.enableSslForBaseDomain(
        this.appName
      )
    );
  }

  render() {
    return (
      <AppDetailsContext.Provider
        value={this.state}
      >
        {this.props.children}
      </AppDetailsContext.Provider>
    );
  }
}

function mapStateToProps(state: { globalReducer: { isMobile: boolean } }) {
  return {
    isMobile: state.globalReducer.isMobile,
  };
}

export default connect(
  mapStateToProps
)(AppDetailsProvider);
