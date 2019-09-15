import React from 'react';
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import ApiComponent from "../../global/ApiComponent";
import { LogFetcher } from './AppDetailsService';
import Toaster from "../../../utils/Toaster";
import { IAppDef, IAppVersion } from '../AppDefinition';

export interface IAppDetailsContext {
  building: boolean,
  appDefinition: IAppDef,
  rootDomain: string | null,
  defaultNginxConfig: string | null,
  isDirty: boolean,
  isMobile: boolean,
  appData: {
    isLoading: boolean,
    isError: boolean,
  },
  logs: {
    appLogs: string | null,
    buildLogs: string | null,
  }

  enableSslForBaseDomain(): Promise<any>;
  enableSslForCustomDomain(name: string): Promise<any>;
  removeCustomDomain(name: string): Promise<any>;
  addCustomDomain(name: string): Promise<any>;
  updateAppDefintion(update: any): void;
  save(): Promise<any>;
  fetchAppData(): Promise<any>;
  deleteApp(name: string, volumes: string[]): Promise<any>;
  renameApp(name: string): Promise<any>;
  forceBuild(token: string): Promise<any>;
  uploadCaptainDefinitionContent(content: string): Promise<any>;
  uploadAppData(file: File): Promise<any>;
  rollbackToVersion(version: IAppVersion): Promise<any>;
}

export const AppDetailsContext = React.createContext<IAppDetailsContext | null>(null)!;

class AppDetailsProvider extends ApiComponent<RouteComponentProps<any> & {
  isMobile: boolean,
}, {
}> {
  state: any = {
    building: false,
    appDefinition: null,
    rootDomain: null,
    defaultNginxConfig: null,
    isDirty: true,
    appData: {
      isLoading: true,
      isError: false,
    },
    logs: {
      appLogs: null,
      buildLogs: null,
    },
  };
  logfetcher: LogFetcher | undefined;

  constructor(props: any) {
    super(props);

    this.state = {
      ...this.state,
      isMobile: props.isMobile,
      updateAppDefintion: this.updateAppDefintion.bind(this),
      fetchAppData: this.fetchAppData.bind(this),
      save: this.save.bind(this),
      addCustomDomain: this.addCustomDomain.bind(this),
      removeCustomDomain: this.removeCustomDomain.bind(this),
      enableSslForCustomDomain: this.enableSslForCustomDomain.bind(this),
      enableSslForBaseDomain: this.enableSslForBaseDomain.bind(this),
      startLogFetcher: this.startLogFetcher.bind(this),
      rollbackToVersion: this.rollbackToVersion.bind(this),
      uploadAppData: this.uploadAppData.bind(this),
      uploadCaptainDefinitionContent: this.uploadCaptainDefinitionContent.bind(this),
      forceBuild: this.forceBuild.bind(this),
      renameApp: this.renameApp.bind(this),
      deleteApp: this.deleteApp.bind(this),
    }
  }

  /* lifecycle */

  static getDerivedStateFromProps(props: any, state: any) {
    if (props.isMobile !== state.isMobile) {
      return {
        ...state,
        isMobile: props.isMobile,
      }
    }

    return state
  }

  componentWillUnmount() {
    if (this.logfetcher) {
      this.logfetcher.stop()
    }

    this.apiManager.destroy()
  }

  asyncSetState = async (state: any) => new Promise((resolve) => this.setState(state, resolve))

  /* modify the app */

  async deleteApp(appName: string, volumes: string[]) {
    this.setState({ appData: { isLoading: true, isError: false } });
    if (this.logfetcher) {
      this.logfetcher.stop()
    }

    try {
      // do the call
      await this.apiManager.deleteApp(appName, volumes)
    } catch(err) {
      // turn loading to off and bubble the error
      this.setState({ appData: { isLoading: false, isError: false } });
      throw err
    }
  }

  async renameApp(newName: string) {
    this.setState({ appData: { isLoading: true, isError: false } });
    if (this.logfetcher) {
      this.logfetcher.stop()
    }

    try {
      await this.apiManager.renameApp(
        this.state.appDefinition.appName,
        newName
      )
      this.props.history.replace(`/apps/details/${newName}`);
      await this.fetchAppData()
    } catch(err) {
      // turn loading to off and bubble the error
      this.setState({ appData: { isLoading: false, isError: false } });
      throw err
    }
  }

  /* get app data */

  async fetchAppData() {
    this.setState({ appData: { isLoading: true, isError: false }});
    const allApps = await this.apiManager.getAllApps();
    this.setState({ appData: { isLoading: false, isError: false }});

    const myApp = allApps.appDefinitions
      .find((app: IAppDef) => app.appName === this.props.match.params.appName );

    if (myApp) {
      if (!this.state.appDefinition || (myApp.appName !== this.state.appDefinition.appName)) {
        this.startLogFetcher(myApp.appName)
      }

      this.setState({
        appDefinition: myApp,
        rootDomain: allApps.rootDomain,
        defaultNginxConfig: allApps.defaultNginxConfig,
        appData: {
          isLoading: false,
          isError: false,
        },
      });
    }

    return myApp;
  }

  async updateBuildVersionsWithoutLoad() {
    try {
      const apps = await this.apiManager.getAllApps();
      const myApp = apps.appDefinitions.find((app: IAppDef) => app.appName === this.state.appDefinition.appName);

      if (myApp) {
        this.setState({
          building: false,
          appDefinition: {
            ...this.state.appDefinition,
            deployedVersion: myApp.deployedVersion,
            versions: myApp.versions,
          }
        });
      } else {
        throw new Error("app not found!");
      }
    }
    catch (err) {
      Toaster.toast(err)
    }
  }

  /* fire builds */

  async uploadCaptainDefinitionContent(content: string) {
    await this.apiManager.uploadCaptainDefinitionContent(
      this.state.appDefinition.appName,
      JSON.parse(content),
      "",
      true
    )

    this.setState({ building: true })
  }

  async rollbackToVersion(version: IAppVersion) {
    // wait for the call to be successful before setting our build state
    await this.apiManager
      .uploadCaptainDefinitionContent(
        this.state.appDefinition.appName,
        {
          schemaVersion: 2,
          // We should use imageName, but since imageName does not report build failure (since there is no build!)
          // If we use that, and the image is not available, the service will not work.
          dockerfileLines: ["FROM " + version.deployedImageName]
        },
        version.gitHash || "",
        true
      )

    this.setState({ building: true })
  }

  async forceBuild(webhook: string) {
    await this.apiManager.forceBuild(webhook)
    this.setState({ building: true })
  }

  /* logs */

  onLogsFetched = (logs: any, error: Error) => {
    if (error) {
      Toaster.toast(error)
    }

    if (logs) {
      // set our building state if we're meant to be building
      if (!this.state.buiding && logs.buildLogs && logs.buildLogs.isAppBuilding) {
        this.setState({ building: true })
      }

      // see if a build is done
      if (logs.buildLogs &&
        !logs.buildLogs.isAppBuilding &&
        this.state.building) {
          // if we stopped building, reload version
          this.updateBuildVersionsWithoutLoad()
      }

      this.setState({ logs })
    }
  }

  startLogFetcher(name: string) {
    if (this.logfetcher) {
      this.logfetcher.stop()
    }

    this.logfetcher = new LogFetcher(this.apiManager, name, this.onLogsFetched)
    this.logfetcher.start()
  }

  /* settings */

  async save() {
    try {
      return await this.callApiWithRefetch(
        () => this.apiManager.updateConfigAndSave(
          this.state.appDefinition.appName!,
          this.state.appDefinition
        )
      )
    } catch (err) {
      Toaster.toast(err)
    }
  }

  updateAppDefintion(update: any) {
    return this.asyncSetState({ isDirty: true, appDefinition: { ...this.state.appDefinition, ...update }});
  }

  uploadAppData(data: File) {
    return this.apiManager.uploadAppData(
      this.state.appDefinition.appName,
      data,
    )
  }

  async callApiWithRefetch(call: Function) {
    this.setState({ appData: { isLoading: true, isError: false } });

    try {
      // do the call
      await call()

      // refetch the data
      await this.fetchAppData()
    } catch(err) {
      // turn loading to off and bubble the error
      this.setState({ appData: { isLoading: false, isError: false } });
      throw err
    }
  }

  addCustomDomain(name: string) {
    return this.callApiWithRefetch(
      () => this.apiManager.attachNewCustomDomainToApp(
        this.state.appDefinition.appName,
        name
      )
    )
  }

  removeCustomDomain(name: string) {
    return this.callApiWithRefetch(
      () => this.apiManager.removeCustomDomain(
        this.state.appDefinition.appName,
        name
      )
    )
  }

  enableSslForCustomDomain(name: string) {
    return this.callApiWithRefetch(
      () => this.apiManager.enableSslForCustomDomain(
        this.state.appDefinition.appName,
        name
      )
    )
  }

  enableSslForBaseDomain() {
    return this.callApiWithRefetch(
      () => this.apiManager.enableSslForBaseDomain(
        this.state.appDefinition.appName
      )
    )
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

function mapStateToProps(state: any) {
  return {
    isMobile: state.globalReducer.isMobile
  };
}

export default connect(
  mapStateToProps,
  undefined
)(AppDetailsProvider);