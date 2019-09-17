import { Affix, Col, Row, Tabs } from "antd";
import React, { RefObject, Component } from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router";
import classnames from "classnames";
import Toaster from "../../../utils/Toaster";
import CenteredSpinner from "../../global/CenteredSpinner";
import ErrorRetry from "../../global/ErrorRetry";
import AppConfigsTab from "./appConfigs/AppConfigsTab";
import DeploymentTab from "./deployment/DeploymentTab";
import HttpSettingsTab from "./httpSettings/HttpSettingsTab";
import AppDetailsProvider, { AppDetailsContext } from "./AppDetailsProvider";
import DetailsCard from "./components/DetailsCard";
import ActionBar from "./components/ActionBar";
const TabPane = Tabs.TabPane;

enum DETIALS_TAB {
  WEB_SETTINGS = "WEB_SETTINGS",
  APP_CONFIGS = "APP_CONFIGS",
  DEPLOYMENT = "DEPLOYMENT",
};

interface PropsInterface extends RouteComponentProps {
  mainContainer: RefObject<HTMLDivElement>;
}

class AppDetailsClass extends Component<PropsInterface, {
  activeTabKey: DETIALS_TAB;
  renderCounterForAffixBug: number;
}> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;
  private reRenderTriggered = false;

  state = {
    activeTabKey: DETIALS_TAB.WEB_SETTINGS,
    renderCounterForAffixBug: 0,
  }

  async componentDidMount() {
    try {
      const app = await this.context.fetchAppData();
      if (!app) {
        this.goBackToApps();
      }
    } catch (err) {
      Toaster.toast(err);
    }
  }

  goBackToApps = () => {
    this.props.history.push("/apps");
  }

  render() {
    const { appData, appDefinition: app } = this.context;

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
          <DetailsCard
            onClose={this.goBackToApps}
          >
            {appData.isLoading && (
              <div style={{
                position: "absolute",
                left: "50%",
              }}>
                <CenteredSpinner />
              </div>
            )}
            <Tabs
              defaultActiveKey={DETIALS_TAB.WEB_SETTINGS}
              onChange={activeTabKey =>
                this.setState({ activeTabKey: activeTabKey as DETIALS_TAB })
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
                  paddingBottom: 20,
                }}
              >
                <ActionBar onClose={this.goBackToApps} />
              </div>
            </Affix>
          </DetailsCard>
        </Col>
      </Row>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapStateToProps(state: any) {
  return {
    isMobile: state.globalReducer.isMobile,
  };
}

const AppDetailsConnect = connect(
  mapStateToProps
)(AppDetailsClass);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const AppDetails = (props: any) => (
  <AppDetailsProvider {...props}>
    <AppDetailsContext.Consumer>
      {() => <AppDetailsConnect {...props} />}
    </AppDetailsContext.Consumer>
  </AppDetailsProvider>
);

export default AppDetails;
