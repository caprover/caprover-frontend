import React, { Component } from "react";
import {
  Row,
  Col,
  Card,
  Icon,
  Input,
  Table
} from "antd";
import { IAppDef } from "./AppDefinition";
import ClickableLink from "../global/ClickableLink";
import { History } from "history";
import { ColumnProps } from "antd/lib/table";
import { connect } from "react-redux";

class AppsTable extends Component<
  {
    history: History;
    apps: IAppDef[];
    rootDomain: string;
    defaultNginxConfig: string;
    isMobile: boolean;
  },
  { searchTerm: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { searchTerm: "" };
  }

  onAppClicked(appName: string) {
    this.props.history.push(`/apps/details/${appName}`);
  }

  createColumns(): ColumnProps<IAppDef>[] {
    const self = this;
    const ALIGN: "center" = "center";
    return [
      {
        title: "App Name",
        dataIndex: "appName",
        key: "appName",
        render: (appName: string) => (
          <ClickableLink onLinkClicked={() => self.onAppClicked(appName)}>
            {appName}
          </ClickableLink>
        )
      },
      {
        title: "Persistent Data	",
        dataIndex: "hasPersistentData",
        key: "hasPersistentData",
        align: ALIGN,
        render: (hasPersistentData: boolean) => {
          if (!hasPersistentData) {
            return <span />;
          }

          return (
            <span>
              <Icon type="check" />
            </span>
          );
        }
      },
      {
        title: "Exposed Webapp",
        dataIndex: "notExposeAsWebApp",
        key: "notExposeAsWebApp",
        align: ALIGN,
        render: (notExposeAsWebApp: boolean) => {
          if (!!notExposeAsWebApp) {
            return <span />;
          }

          return (
            <span>
              <Icon type="check" />
            </span>
          );
        }
      },
      {
        title: "Instance Count",
        dataIndex: "instanceCount",
        key: "instanceCount",
        align: ALIGN
      },
      {
        title: "Open in Browser",
        dataIndex: "notExposeAsWebApp",
        key: "openInBrowser",
        align: ALIGN,
        render: (notExposeAsWebApp: boolean, app: IAppDef) => {
          if (notExposeAsWebApp) {
            return <span />;
          }

          return (
            <a
              href={
                "http" +
                (app.hasDefaultSubDomainSsl ? "s" : "") +
                "://" +
                app.appName +
                "." +
                self.props.rootDomain
              }
              target="_blank"
              rel="noopener noreferrer"
            >
              <Icon type="link" />{" "}
            </a>
          );
        }
      }
    ];
  }

  render() {
    const self = this;

    const appsToRender = self.props.apps.filter(app => {
      if (!self.state.searchTerm) return true;

      return app.appName!.indexOf(self.state.searchTerm) >= 0;
    });

    const searchAppInput = 
    <Input
      placeholder="Search by Name"
      type="text"
      onChange={event =>
        self.setState({
          searchTerm: (event.target.value || "").trim()
        })
      }
    />

    return (
      <Row type="flex" justify="center">
      <Col xs={{ span: 23 }} lg={{ span: 16 }} style={{ paddingBottom: 300 }}>
          <Card
            extra={ !!!self.props.isMobile && searchAppInput }
            title={
              <React.Fragment>
                <span>
                  <Icon type="code" />
                  &nbsp;&nbsp;&nbsp;Your Apps
                </span>
                <br/>
                { self.props.isMobile && searchAppInput }
              </React.Fragment>
            }
          >
          
            <Row>
              {self.props.isMobile ?
              appsToRender.map(({
                appName = "", 
                hasPersistentData, 
                notExposeAsWebApp, 
                instanceCount,
                hasDefaultSubDomainSsl
              }) => (
                <Card
                  type="inner"
                  title={appName}
                  key={appName}
                  extra={
                    <ClickableLink onLinkClicked={() => self.onAppClicked(appName)}>
                      Details
                    </ClickableLink>
                  }
                >
                  <p>Persistant Data: { 
                    !hasPersistentData ? null : 
                      <span>
                        <Icon type="check" />
                      </span>
                    }
                  </p>
                  <p>Exposed Webapp: {
                    !!notExposeAsWebApp ? null : 
                      <span>
                        <Icon type="check" />
                      </span> 
                    }
                  </p>
                  <p>Instance Count: {instanceCount}</p>
                  <p>Open in Browser: {
                    !!notExposeAsWebApp ? null :
                      <a
                        href={
                          "http" +
                          (hasDefaultSubDomainSsl ? "s" : "") +
                          "://" +
                          appName +
                          "." +
                          self.props.rootDomain
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon type="link" />{" "}
                      </a>
                    }
                  </p>
                </Card>
              ))
              :
              <Table<IAppDef>
                rowKey="appName"
                columns={self.createColumns()}
                dataSource={appsToRender}
                pagination={false}
                size="middle"
              />}
            </Row>
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

export default connect(
  mapStateToProps,
  undefined
)(AppsTable);