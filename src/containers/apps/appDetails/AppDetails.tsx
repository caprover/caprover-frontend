import {
  Affix,
  Button,
  Card,
  Checkbox,
  Col,
  Icon,
  Input,
  message,
  Modal,
  Popover,
  Row,
  Tabs,
  Tooltip,
  Alert
} from "antd";
import React, { RefObject, Component } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import classnames from "classnames";
import { IHashMapGeneric } from "../../../models/IHashMapGeneric";
import Toaster from "../../../utils/Toaster";
import CenteredSpinner from "../../global/CenteredSpinner";
import ClickableLink from "../../global/ClickableLink";
import ErrorRetry from "../../global/ErrorRetry";
import { IAppDef, IAppVolume } from "../AppDefinition";
import AppConfigsTab from "./appConfigs/AppConfigsTab";
import DeploymentTab from "./deployment/DeploymentTab";
import HttpSettingsTab from "./httpSettings/HttpSettingsTab";
import AppDetailsProvider, { AppDetailsContext } from "./AppDetailsProvider";
import ContainerStatus from "./components/ContainerStatus";
const TabPane = Tabs.TabPane;

enum DETIALS_TAB {
  WEB_SETTINGS = "WEB_SETTINGS",
  APP_CONFIGS = "APP_CONFIGS",
  DEPLOYMENT = "DEPLOYMENT",
};

export interface SingleAppApiData {
  appDefinition: IAppDef;
  rootDomain: string;
  defaultNginxConfig: string;
}

interface PropsInterface extends RouteComponentProps<any> {
  mainContainer: RefObject<HTMLDivElement>;
}

class AppDetails extends Component<
  PropsInterface
> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;
  private reRenderTriggered = false;

  state = {
    activeTabKey: DETIALS_TAB.WEB_SETTINGS,
    renderCounterForAffixBug: 0,
    confirmedAppNameToDelete: "",
    volumesToDelete: {} as IHashMapGeneric<boolean>,
  }

  async componentDidMount() {
    try {
      const app = await this.context.fetchAppData()
      if (!app) {
        this.goBackToApps()
      }
    } catch (err) {
      Toaster.toast(err)
    }
  }

  asyncSetState = async (state: any) => new Promise((resolve) => this.setState(state, resolve))

  goBackToApps = () => {
    this.props.history.push("/apps");
  }

  openRenameAppDialog = () => {
    const self = this;
    const { appDefinition: app } = this.context;
    const tempVal = { newName: app.appName };

    Modal.confirm({
      title: "Rename the app:",
      content: (
        <div>
          <Alert
            type="warning"
            message="If other apps use the current name to communicate with this app, make sure to update them as well to avoid problems."
          />
          <Input
            style={{ marginTop: 15 }}
            placeholder="app-name-here"
            defaultValue={app.appName}
            onChange={e => {
              tempVal.newName = (e.target.value || "").trim();
            }}
          />
        </div>
      ),
      onOk() {
        const changed = app.appName !== tempVal.newName;
        if (changed && tempVal.newName) self.renameAppTo(tempVal.newName);
      }
    });
  }

  viewDescription = () => {
    const self = this;
    const { appDefinition: app } = this.context;
    const tempVal = { tempDescription: app.description };

    Modal.confirm({
      title: "App Description:",
      content: (
        <div>
          <Input.TextArea
            style={{ marginTop: 15 }}
            placeholder="Use app description to take some notes for your app"
            rows={12}
            defaultValue={app.description}
            onChange={e => {
              tempVal.tempDescription = e.target.value;
            }}
          />
        </div>
      ),
      onOk() {
        const changed = app.description !== tempVal.tempDescription;
        app.description = tempVal.tempDescription;
        if (changed) self.onUpdateConfigAndSave();
      }
    });
  }

  getDeleteModalContent = (app: IAppDef, volumes: string[]) => {
    return (
      <div>
        <p>
          You are about to delete <code>{app.appName}</code>. Enter the
          name of this app in the box below to confirm deletion of this app.
          Please note that this is
          <b> not reversible</b>.
        </p>
        {volumes.length > 0 && (
          <p>
            Please select the volumes you want to delete. Note that if any of
            the volumes are being used by other CapRover apps, they will not be
            deleted even if you select them. <b>Note: </b>deleting volumes takes
            more than 10 seconds, please be patient
          </p>
        )}
        {volumes.map(v => {
          return (
            <div key={v}>
              <Checkbox
                defaultChecked={!!this.state.volumesToDelete[v]}
                onChange={() => {
                  this.setState({ volumesToDelete: { ...this.state.volumesToDelete, [v]: !this.state.volumesToDelete[v] }})
                }}
              >
                {v}
              </Checkbox>
            </div>
          );
        })}
        <br />
        <br />

        <p>Confirm App Name:</p>
        <Input
          type="text"
          placeholder={app.appName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            this.setState({ confirmedAppNameToDelete: e.target.value.trim() })
          }}
        />
      </div>
    )
  }

  async onDeleteConfirm() {
    const { appDefinition: app } = this.context;

    if (this.state.confirmedAppNameToDelete !== app.appName) {
      message.warning("App name did not match. Operation cancelled.");
      return;
    }

    const volumes: string[] = [];
    Object.keys(this.state.volumesToDelete).forEach(v => {
      if (this.state.volumesToDelete[v]) {
        volumes.push(v);
      }
    });

    try {
      const data = await this.context.deleteApp(app.appName, volumes);

      const volumesFailedToDelete = data ? data.volumesFailedToDelete as string[] : null;
      if (volumesFailedToDelete && volumesFailedToDelete.length) {
        Modal.info({
          title: "Some volumes weren't deleted!",
          content: (
            <div>
              <p>
                Some volumes weren't deleted because they were probably
                being used by other containers. Sometimes, this is because
                of a temporary delay when the original container deletion
                was done with a delay. Please see{" "}
                <a
                  href="https://caprover.com/docs/app-configuration.html#removing-persistent-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentations
                </a>{" "}
                and delete them manually if needed. Skipped volumes are:
              </p>
              <ul>
                {volumesFailedToDelete.map(v => (
                  <li>
                    <code>{v}</code>
                  </li>
                ))}
              </ul>
            </div>
          )
        });
      }
      message.success("App deleted!");
      this.goBackToApps();
    } catch(err) {
      Toaster.toast(err);
    }
  }

  async onDeleteAppClicked() {
    const self = this;
    const { appDefinition: app } = this.context;

    const allVolumes: string[] = [];
    const volumesToDelete: IHashMapGeneric<boolean> = {};

    if (app.volumes) {
      app.volumes.forEach((v: IAppVolume) => {
        if (v.volumeName) {
          allVolumes.push(v.volumeName);
          volumesToDelete[v.volumeName] = true;
        }
      });
    }

    await this.asyncSetState({ volumesToDelete, confirmedAppNameToDelete: "" });

    Modal.confirm({
      title: "Confirm Permanent Delete?",
      content: this.getDeleteModalContent(app, allVolumes),
      onOk() {
        self.onDeleteConfirm();
      }
    });
  }

  async renameAppTo(newName: string) {
    try {
      await this.context.renameApp(newName);
    } catch (err) {
      Toaster.toast(err);
    }
  }

  onUpdateConfigAndSave() {
    this.context.save();
  }

  render() {
    const { appData, appDefinition: app, isMobile } = this.context;

    if (!app && appData.isLoading) {
      return <CenteredSpinner />;
    }

    if (!this.reRenderTriggered) {
      //crazy hack to make sure the Affix is showing (delete and save & update)
      this.reRenderTriggered = true;
      setTimeout(() =>
        this.setState({ renderCounterForAffixBug: 1 })
      , 50);
    }

    if (!app) {
      return <ErrorRetry />;
    }

    return (
      <Row>
        <Col span={20} offset={2}>
          <Card
            extra={
              <ClickableLink onLinkClicked={this.goBackToApps}>
                <Tooltip title="Close">
                  <Icon type="close" />
                </Tooltip>
              </ClickableLink>
            }
            title={
              <div>
                <div>
                  <ClickableLink onLinkClicked={this.openRenameAppDialog}>
                    <Tooltip title="Rename app" placement="bottom">
                      <Icon type="edit" />
                    </Tooltip>
                  </ClickableLink>
                  &nbsp;&nbsp;
                  {app.appName}
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  <ClickableLink onLinkClicked={this.viewDescription}>
                    <Popover
                      placement="bottom"
                      content={
                        <div style={{ maxWidth: 300, whiteSpace: "pre-line" }}>
                          {app.description || "Click to edit app description..."}
                        </div>
                      }
                      title="App description"
                    >
                      <Icon type="read" />
                    </Popover>
                  </ClickableLink>
                </div>
                <div>
                  <ContainerStatus />
                </div>
              </div>
            }
          >
            {appData.isLoading && (
              <div style={{
                position: 'absolute',
                left: '50%'
              }}>
                <CenteredSpinner />
              </div>
            )}
            <Tabs
              defaultActiveKey={DETIALS_TAB.WEB_SETTINGS}
              onChange={activeTabKey =>
                this.setState({ activeTabKey })
              }
              className={classnames({ "disabled": appData.isLoading })}
            >
              <TabPane
                tab={<span className="unselectable-span">HTTP Settings</span>}
                key={DETIALS_TAB.WEB_SETTINGS}
              >
                <HttpSettingsTab />
              </TabPane>
              <TabPane
                tab={<span className="unselectable-span">App Configs</span>}
                key={DETIALS_TAB.APP_CONFIGS}
              >
                <AppConfigsTab />
              </TabPane>
              <TabPane
                tab={<span className="unselectable-span">Deployment</span>}
                key={DETIALS_TAB.DEPLOYMENT}
              >
                <DeploymentTab />
              </TabPane>
            </Tabs>
            <div style={{ height: 70 }} />

            <Affix
              offsetBottom={10}
              target={() => {
                const newLocal = this.props.mainContainer;
                return newLocal && newLocal.current ? newLocal.current : window;
              }}
            >
              <div
                className={classnames({
                  "hide-on-demand": this.state.activeTabKey === DETIALS_TAB.DEPLOYMENT,
                  "disabled": appData.isLoading,
                })}
                style={{
                  borderRadius: 8,
                  background: "rgba(51,73,90,0.9)",
                  paddingTop: 20,
                  paddingBottom: 20
                }}
              >
                <Row type="flex" justify="center" gutter={20}>
                  <Col span={8}>
                    <div style={{ textAlign: "center" }}>
                      <Button
                        style={{ minWidth: isMobile ? 35 : 135 }}
                        type="danger"
                        size="large"
                        onClick={this.onDeleteAppClicked}
                      >
                        {isMobile ? (
                          <Icon type="delete" />
                        ) : (
                          "Delete App"
                        )}
                      </Button>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div style={{ textAlign: "center" }}>
                      <Button
                        style={{ minWidth: isMobile ? 35 : 135 }}
                        type="primary"
                        size="large"
                        onClick={() => this.context.save()}
                      >
                        {isMobile ? (
                          <Icon type="save" />
                        ) : (
                          "Save & Update"
                        )}
                      </Button>
                    </div>
                  </Col>
                </Row>
              </div>
            </Affix>
          </Card>
        </Col>
      </Row>
    );
  }
}

function mapStateToProps(state: any) {
  return {
    isMobile: state.globalReducer.isMobile
  };
}

const AppDetailsConnect = connect(
  mapStateToProps,
  undefined
)(AppDetails);

export default (props: any) => (
  <AppDetailsProvider {...props}>
    <AppDetailsContext.Consumer>
      {() => <AppDetailsConnect {...props} />}
    </AppDetailsContext.Consumer>
  </AppDetailsProvider>
);
