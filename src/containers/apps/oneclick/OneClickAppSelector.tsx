import { Alert, Button, Card, Col, Icon, Input, Row, Select } from "antd";
import React, { Component } from "react";
import { RouteComponentProps } from "react-router";
import OneClickAppsApi from "../../../api/OneClickAppsApi";
import { IOneClickAppIdentifier } from "../../../models/IOneClickAppModels";
import Toaster from "../../../utils/Toaster";
import Utils from "../../../utils/Utils";
import CenteredSpinner from "../../global/CenteredSpinner";

export const TEMPLATE_ONE_CLICK_APP = "TEMPLATE_ONE_CLICK_APP";

export default class OneClickAppSelector extends Component<
  RouteComponentProps<any>,
  {
    oneClickAppList: IOneClickAppIdentifier[] | undefined;
    selectedApp: string | undefined;
    templateOneClickAppData: string;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      oneClickAppList: undefined,
      selectedApp: undefined,
      templateOneClickAppData: ""
    };
  }

  componentDidMount() {
    const self = this;
    new OneClickAppsApi()
      .getAllOneClickApps()
      .then(function(data) {
        self.setState({
          oneClickAppList: data
        });
      })
      .catch(Toaster.createCatcher());
  }

  createOptions() {
    let options = this.state.oneClickAppList!.map(app => {
      return (
        <Select.Option key={app.name} value={app.name}>
          {app.name}
        </Select.Option>
      );
    });

    options.push(
      <Select.Option
        key={TEMPLATE_ONE_CLICK_APP}
        value={TEMPLATE_ONE_CLICK_APP}
      >
        {`>>`} TEMPLATE {`<<`}
      </Select.Option>
    );

    return options;
  }

  render() {
    const self = this;

    if (!this.state.oneClickAppList) return <CenteredSpinner />;

    return (
      <div>
        <Row type="flex" justify="center">
          <Col xs={{ span: 23 }} lg={{ span: 16 }}>
            <Card title="One Click Apps">
              <p>
                Choose an app, a database or a bundle (app+database) from the
                list below. The rest is magic, well... Wizard!
              </p>
              <p>
                One click apps are retrieved from :{" "}
                <a
                  href="https://github.com/caprover/one-click-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  CapRover One Click Apps Repository
                </a>
              </p>
              {Utils.isSafari() ? (
                <Alert
                  message="You seem to be using Safari. Deployment of one-click apps may be unstable on Safari. Using Chrome is recommended"
                  type="warning"
                />
              ) : (
                <div />
              )}
              <div style={{ height: 50 }} />
              <Row type="flex" justify="end" align="middle">
                <b>One-Click Apps List: &nbsp;&nbsp;</b>
                <Select
                  showSearch
                  style={{ minWidth: 180 }}
                  onChange={value => {
                    self.setState({ selectedApp: value.toString() });
                  }}
                >
                  {self.createOptions()}
                </Select>
              </Row>
              <div style={{ height: 30 }} />
              <div
                className={
                  self.state.selectedApp === TEMPLATE_ONE_CLICK_APP
                    ? ""
                    : "hide-on-demand"
                }
              >
                <div>
                  <p>
                    This is mainly for testing. You can copy and paste your
                    custom One-Click app template here. See{" "}
                    <a
                      href="https://github.com/caprover/one-click-apps/tree/master/public/v1/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      the main one click apps GitHub repository
                    </a>{" "}
                    for samples and ideas.
                  </p>
                </div>

                <Input.TextArea
                  className="code-input"
                  placeholder={`{
  "captainVersion": "1",
  "dockerCompose": {
      "services": {
          "$$cap_appname": {
              "image": "adminer:$$cap_adminer_version",
              "containerHttpPort": "8080",
              "environment": {
                  "ADMINER_DESIGN": "$$cap_adminer_design"
              }
          }
      }
  }
  ......`}
                  rows={10}
                  onChange={e => {
                    self.setState({ templateOneClickAppData: e.target.value });
                  }}
                />
              </div>
              <div style={{ height: 30 }} />
              <Row type="flex" justify="space-between" align="middle">
                <div>
                  <a
                    href="https://caprover.com/docs/one-click-apps.html#what-about-other-apps"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon type="info-circle" />
                  </a>
                  &nbsp; What if the app/database I want is not listed here?
                  &nbsp;
                </div>
                <Button
                  onClick={() =>
                    self.props.history.push(
                      `/apps/oneclick/${self.state.selectedApp}` +
                        (self.state.selectedApp === TEMPLATE_ONE_CLICK_APP
                          ? "?oneClickAppStringifiedData=" +
                            encodeURIComponent(
                              self.state.templateOneClickAppData
                            )
                          : "")
                    )
                  }
                  disabled={!self.state.selectedApp}
                  style={{ minWidth: 150 }}
                  type="primary"
                >
                  Next
                </Button>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
