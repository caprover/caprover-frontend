import React from "react";
import { RouteComponentProps } from "react-router";
import Toaster from "../../utils/Toaster";
import ApiComponent from "../global/ApiComponent";
import CenteredSpinner from "../global/CenteredSpinner";
import ErrorRetry from "../global/ErrorRetry";
import { IAppDef } from "./AppDefinition";
import AppsTable from "./AppsTable";
import CreateNewApp from "./CreateNewApp";

export default class Apps extends ApiComponent<
  RouteComponentProps<any>,
  {
    isLoading: boolean;
    apiData:
      | {
          appDefinitions: IAppDef[];
          defaultNginxConfig: string;
          rootDomain: string;
        }
      | undefined;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      isLoading: true,
      apiData: undefined
    };
  }

  onCreateOneClickAppClicked() {
    this.props.history.push(`/apps/oneclick/`);
  }

  onCreateNewAppClicked(appName: string, hasPersistentData: boolean){
    Promise.resolve() //
      .then(() => {
        this.setState({ isLoading: true });
        return this.apiManager.registerNewApp(appName, hasPersistentData, true);
      })
      .then(() => {
        return this.reFetchData();
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.setState({ isLoading: false });
      });
  }

  render() {
    if (this.state.isLoading) {
      return <CenteredSpinner />;
    }

    const apiData = this.state.apiData;

    if (!apiData) {
      return <ErrorRetry />;
    }

    return (
      <div>
        <CreateNewApp
          onCreateNewAppClicked={(appName: string, hasPersistency: boolean) => {
            this.onCreateNewAppClicked(appName, hasPersistency);
          }}
          onCreateOneClickAppClicked={() => {
            this.onCreateOneClickAppClicked();
          }}
        />
        <div style={{ height: 25 }} />
        {apiData.appDefinitions.length > 0 ? (
          <AppsTable
            history={this.props.history}
            defaultNginxConfig={apiData.defaultNginxConfig}
            apps={apiData.appDefinitions}
            rootDomain={apiData.rootDomain}
          />
        ) : (
          <div />
        )}
      </div>
    );
  }

  componentDidMount() {
    this.reFetchData();
  }

  reFetchData() {
    this.setState({ isLoading: true });
    return this.apiManager
      .getAllApps()
      .then((data: any) => {
        this.setState({ apiData: data });
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.setState({ isLoading: false });
      });
  }
}
