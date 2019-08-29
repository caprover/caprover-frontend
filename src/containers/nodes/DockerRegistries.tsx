import { Alert, message } from "antd";
import React from "react";
import { connect } from "react-redux";
import { emitDefaultRegistryChanged } from "../../redux/actions/DefaultRegistryActions";
import { IRegistryApi, IRegistryInfo, IRegistryTypes } from "../../models/IRegistryInfo";
import Toaster from "../../utils/Toaster";
import ApiComponent from "../global/ApiComponent";
import CenteredSpinner from "../global/CenteredSpinner";
import ErrorRetry from "../global/ErrorRetry";
import DefaultDockerRegistry from "./DefaultDockerRegistry";
import DockerRegistriesStaticInfo from "./DockerRegistriesStaticInfo";
import DockerRegistryAdd from "./DockerRegistryAdd";
import DockerRegistryTable from "./DockerRegistryTable";

class DockerRegistries extends ApiComponent<
  { 
    emitDefaultRegistryChanged: Function;
    isMobile: boolean;
   },
  { apiData: IRegistryApi | undefined; isLoading: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      apiData: undefined,
      isLoading: true
    };
  }

  fetchData() {
    this.setState({ apiData: undefined, isLoading: true });
    this.apiManager
      .getDockerRegistries()
      .then((data) => {
        this.setState({ apiData: data });
        this.props.emitDefaultRegistryChanged(
          (data as IRegistryApi).defaultPushRegistryId
        );
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.setState({ isLoading: false });
      });
  }

  changeDefault(id: string) {
    this.setState({ apiData: undefined, isLoading: true });

    this.apiManager
      .setDefaultPushDockerRegistry(id)
      .then(() => {
        message.success("Default push registry successfully changed.");
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.fetchData();
      });
  }

  deleteRegistry(id: string) {
    const isSelfHosted =
      this.state
        .apiData!.registries.map(
          reg => reg.registryType === IRegistryTypes.LOCAL_REG && reg.id === id
        )
        .indexOf(true) >= 0;

    this.setState({ apiData: undefined, isLoading: true });

    (isSelfHosted
      ? this.apiManager.disableSelfHostedDockerRegistry()
      : this.apiManager.deleteDockerRegistry(id)
    )
      .then(() => {
        message.success("Registry deleted.");
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.fetchData();
      });
  }

  editRegistry(dockerRegistry: IRegistryInfo) {
    this.setState({ apiData: undefined, isLoading: true });

    this.apiManager
      .updateDockerRegistry(dockerRegistry)
      .then(() => {
        message.success("Registry updated.");
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.fetchData();
      });
  }

  addDockerRegistry(dockerRegistry: IRegistryInfo) {
    this.setState({ apiData: undefined, isLoading: true });
    (dockerRegistry.registryType === IRegistryTypes.LOCAL_REG
      ? this.apiManager.enableSelfHostedDockerRegistry()
      : this.apiManager.addDockerRegistry(dockerRegistry)
    )
      .then(() => {
        message.success("Docker registry successfully added!");
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.fetchData();
      });
  }

  componentDidMount() {
    this.fetchData();
  }

  render() {
    if (this.state.isLoading) {
      return <CenteredSpinner />;
    }

    if (!this.state.apiData) {
      return <ErrorRetry />;
    }

    return (
      <div>
        <DockerRegistriesStaticInfo />

        <div style={{ height: 60 }} />
        <div
          style={{ textAlign: "center" }}
          className={
            this.state.apiData.registries.length === 0 ? "" : "hide-on-demand"
          }
        >
          <Alert
            type="info"
            message="No registries is added yet. Go ahead and add your first registry!"
          />
        </div>

        <div
          className={
            this.state.apiData.registries.length > 0 ? "" : "hide-on-demand"
          }
        >
          <DefaultDockerRegistry
            apiData={this.state.apiData!}
            changeDefault={id => {
              this.changeDefault(id);
            }}
          />

          <div style={{ height: 40 }} />

          <DockerRegistryTable
            apiData={this.state.apiData!}
            isMobile={this.props.isMobile}
            deleteRegistry={id => {
              this.deleteRegistry(id);
            }}
            editRegistry={dockerRegistry => {
              this.editRegistry(dockerRegistry);
            }}
          />
        </div>
        <div style={{ height: 50 }} />
        <DockerRegistryAdd
          apiData={this.state.apiData!}
          isMobile={this.props.isMobile}
          addDockerRegistry={dockerRegistry =>
            this.addDockerRegistry(dockerRegistry)
          }
        />
      </div>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
    defaultRegistryId: state.registryReducer.defaultRegistryId,
    isMobile: state.globalReducer.isMobile
  };
}

export default connect(
  mapStateToProps,
  {
    emitDefaultRegistryChanged: emitDefaultRegistryChanged
  }
)(DockerRegistries);
