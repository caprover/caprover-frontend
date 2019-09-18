import React, { RefObject, Fragment } from "react";
import { RouteComponentProps, Switch, Route } from "react-router";
import ApiManager from "../api/ApiManager";
import { Layout, Menu, Icon, Row, Col, Button } from "antd";
import ClickableLink from "./global/ClickableLink";
import Dashboard from "./Dashboard";
import LoggedInCatchAll from "./LoggedInCatchAll";
import Cluster from "./nodes/Cluster";
import Apps from "./apps/Apps";
import { SelectParam } from "antd/lib/menu";
import AppDetails from "./apps/appDetails/AppDetails";
import Monitoring from "./monitoring/Monitoring";
import Settings from "./settings/Settings";
import OneClickAppSelector from "./apps/oneclick/OneClickAppSelector";
import OneClickAppConfigPage from "./apps/oneclick/OneClickAppConfigPage";
import ApiComponent from "./global/ApiComponent";
import Toaster from "../utils/Toaster";
import { IVersionInfo } from "../models/IVersionInfo";
import * as GlobalActions from "../redux/actions/GlobalActions";
import { connect } from "react-redux";

const { Header, Content, Sider } = Layout;

const MENU_ITEMS = [
  {
    key: "dashboard",
    name: "Dashboard",
    icon: "laptop"
  },
  {
    key: "apps",
    name: "Apps",
    icon: "code"
  },
  {
    key: "monitoring",
    name: "Monitoring",
    icon: "dashboard"
  },
  {
    key: "cluster",
    name: "Cluster",
    icon: "cluster"
  },
  {
    key: "settings",
    name: "Settings",
    icon: "setting"
  }
];

interface RootPageInterface extends RouteComponentProps<any> {
  rootElementKey: string;
  emitSizeChanged: () => void;
  isMobile: boolean;
}

class PageRoot extends ApiComponent<
  RootPageInterface,
  {
    versionInfo: IVersionInfo | undefined;
    collapsed: boolean;
  }
> {
  private mainContainer: RefObject<HTMLDivElement>;

  constructor(props: any) {
    super(props);
    this.mainContainer = React.createRef();
    this.state = {
      versionInfo: undefined,
      collapsed: false
    };
  }

  updateDimensions = () => this.props.emitSizeChanged();

  componentWillUnmount() {
    if (super.componentWillUnmount) super.componentWillUnmount();
    this.updateDimensions();
    window.removeEventListener("resize", this.updateDimensions);
  }

  componentDidUpdate(prevProps: any) {
    // Typical usage (don't forget to compare props):
    if (
      this.props.location.pathname !== prevProps.location.pathname &&
      this.props.isMobile
    ) {
      this.setState({ collapsed: true });
    }
  }

  componentDidMount() {
    const self = this;
    this.updateDimensions();

    window.addEventListener("resize", this.updateDimensions);

    if (!ApiManager.isLoggedIn()) {
      this.goToLogin();
    } else {
      this.apiManager
        .getVersionInfo()
        .then(function(data) {
          self.setState({ versionInfo: data });
        })
        .catch(Toaster.createCatcher());
    }
  }

  goToLogin() {
    this.props.history.push("/login");
  }

  createUpdateAvailableIfNeeded() {
    const self = this;

    if (!self.state.versionInfo || !self.state.versionInfo.canUpdate) {
      return null;
    }

    return (
      <Fragment>
        <ClickableLink
          onLinkClicked={() => self.props.history.push("/settings")}
        >
          <Icon
            type="gift"
            theme="twoTone"
            style={{
              marginLeft: 50
            }}
          />
          <Icon
            type="gift"
            theme="twoTone"
            style={{
              marginRight: 10,
              marginLeft: 3
            }}
          />
          Update Available!
          <Icon
            type="gift"
            theme="twoTone"
            style={{
              marginLeft: 10
            }}
          />
          <Icon
            type="gift"
            theme="twoTone"
            style={{
              marginLeft: 3
            }}
          />
        </ClickableLink>
      </Fragment>
    );
  }

  onSelectMenu(param: SelectParam) {
    this.props.history.push("/" + param.key);
  }

  toggleSider = () => {
    this.setState({ collapsed: !this.state.collapsed });
  };

  render() {
    const self = this;
    return (
      <Layout className="full-screen-bg">
        <Header
          className="header"
          style={{
            padding: `0 ${this.props.isMobile ? 15 : 50}px`
          }}
        >
          <div>
            <Row>
              {this.props.isMobile && (
                <Col span={4}>
                  <Button ghost icon="bars" onClick={this.toggleSider} />
                </Col>
              )}
              {(this.props.isMobile &&
                self.createUpdateAvailableIfNeeded()) || (
                <Col lg={{ span: 12 }} xs={{ span: 20 }}>
                  <div>
                    <h3 style={{ color: "#fff" }}>
                      <img
                        alt="logo"
                        src="/icon-512x512.png"
                        style={{
                          height: 45,
                          marginRight: 10
                        }}
                      />
                      CapRover
                      {self.createUpdateAvailableIfNeeded()}
                    </h3>
                  </div>
                </Col>
              )}
              {!self.props.isMobile && (
                <Col span={12}>
                  <Row type="flex" justify="end">
                    <a
                      href="https://github.com/caprover/caprover"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginRight: 20 }}
                    >
                      GitHub
                    </a>

                    <a
                      href="https://caprover.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ marginRight: 70 }}
                    >
                      Docs
                    </a>
                    <span>
                      <span
                        style={{
                          border: "1px solid #1b8ad3",
                          borderRadius: 5,
                          padding: 8
                        }}
                      >
                        <ClickableLink
                          onLinkClicked={() => {
                            self.apiManager.setAuthToken("");
                            self.goToLogin();
                          }}
                        >
                          Logout <Icon type="logout" />
                        </ClickableLink>
                      </span>
                    </span>
                  </Row>
                </Col>
              )}
            </Row>
          </div>
        </Header>

        <Layout>
          <Sider
            breakpoint="lg"
            trigger={this.props.isMobile && null}
            collapsible
            collapsed={this.state.collapsed}
            width={200}
            collapsedWidth={self.props.isMobile ? 0 : 80}
            style={{ zIndex: 2 }}
            onCollapse={this.toggleSider}
          >
            <Menu
              selectedKeys={[this.props.location.pathname.substring(1)]}
              onSelect={(param: SelectParam) => {
                this.onSelectMenu(param);
              }}
              theme="dark"
              mode="inline"
              defaultSelectedKeys={["dashboard"]}
              style={{ height: "100%", borderRight: 0 }}
            >
              {MENU_ITEMS.map(item => (
                <Menu.Item key={item.key}>
                  <span>
                    <Icon type={item.icon} />
                    <span>{item.name}</span>
                  </span>
                </Menu.Item>
              ))}

              {this.props.isMobile && (
                <Fragment>
                  <div
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.65)",
                      height: 1,
                      width: "80%",
                      margin: "15px auto"
                    }}
                  />
                  <div
                    className="ant-menu-item"
                    role="menuitem"
                    style={{ paddingLeft: 24 }}
                  >
                    <a
                      href="https://github.com/caprover/caprover"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon type="github" />
                      GitHub
                    </a>
                  </div>

                  <div
                    className="ant-menu-item"
                    role="menuitem"
                    style={{ paddingLeft: 24 }}
                  >
                    <a
                      href="https://caprover.com"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon type="file-text" />
                      Docs
                    </a>
                  </div>

                  <div
                    className="ant-menu-item"
                    role="menuitem"
                    style={{ paddingLeft: 24 }}
                  >
                    <ClickableLink
                      onLinkClicked={() => {
                        this.apiManager.setAuthToken("");
                        this.goToLogin();
                      }}
                    >
                      {" "}
                      <Icon type="logout" />
                      Logout
                    </ClickableLink>
                  </div>
                </Fragment>
              )}
            </Menu>
          </Sider>
          <Content>
            <div
              key={self.props.rootElementKey}
              ref={self.mainContainer}
              style={{
                paddingTop: 12,
                paddingBottom: 36,
                height: "100%",
                overflowY: "scroll",
                marginRight: self.state.collapsed
                  ? 0
                  : self.props.isMobile
                  ? -200
                  : 0,
                transition: "margin-right 0.3s ease"
              }}
              id="main-content-layout"
            >
              <Switch>
                <Route path="/dashboard/" component={Dashboard} />
                <Route
                  path="/apps/details/:appName/:tab?"
                  render={props => (
                    <AppDetails {...props} mainContainer={self.mainContainer} />
                  )}
                />
                <Route
                  path="/apps/oneclick/:appName"
                  component={OneClickAppConfigPage}
                />
                <Route path="/apps/oneclick" component={OneClickAppSelector} />
                <Route path="/apps/" component={Apps} />
                <Route path="/monitoring/" component={Monitoring} />
                <Route path="/cluster/" component={Cluster} />
                <Route path="/settings/" component={Settings} />
                <Route path="/" component={LoggedInCatchAll} />
              </Switch>
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}

function mapStateToProps(state: any) {
  return {
    rootElementKey: state.globalReducer.rootElementKey,
    isMobile: state.globalReducer.isMobile
  };
}

export default connect(
  mapStateToProps,
  {
    emitSizeChanged: GlobalActions.emitSizeChanged
  }
)(PageRoot);
