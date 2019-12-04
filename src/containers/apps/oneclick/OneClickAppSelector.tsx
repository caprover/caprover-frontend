import { Alert, Button, Card, Col, Input, Row } from "antd";
import React, { Component } from "react";
import { RouteComponentProps } from "react-router";
import OneClickAppsApi from "../../../api/OneClickAppsApi";
import { IOneClickAppIdentifier } from "../../../models/IOneClickAppModels";
import Toaster from "../../../utils/Toaster";
import Utils from "../../../utils/Utils";
import CenteredSpinner from "../../global/CenteredSpinner";
import NewTabLink from "../../global/NewTabLink";
import OneClickGrid from "./OneClickGrid";

export const TEMPLATE_ONE_CLICK_APP = "TEMPLATE_ONE_CLICK_APP";
export const ONE_CLICK_APP_STRINGIFIED_KEY = "oneClickAppStringifiedData";

export default class OneClickAppSelector extends Component<
  RouteComponentProps<any>,
  {
    oneClickAppList: IOneClickAppIdentifier[] | undefined;
    isOneClickAppSelected: boolean;
    templateOneClickAppData: string;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      oneClickAppList: undefined,
      isOneClickAppSelected: false,
      templateOneClickAppData: ""
    };
  }

  componentDidMount() {
    const self = this;
    new OneClickAppsApi()
      .getAllOneClickApps()
      .then(function(data) {
        data.push({
          name: TEMPLATE_ONE_CLICK_APP,
          description:
            "A template for creating one-click apps. Mainly for development!",
          logoUrl: "/icon-512x512.png",
          jsonUrl: "",
          displayName: ">> TEMPLATE <<"
        });
        self.setState({
          oneClickAppList: data
        });
      })
      .catch(Toaster.createCatcher());
  }

  render() {
    const self = this;

    if (!this.state.oneClickAppList) return <CenteredSpinner />;

    let isOneClickJsonValid = true;
    if (this.state.templateOneClickAppData) {
      try {
        JSON.parse(this.state.templateOneClickAppData);
      } catch (error) {
        isOneClickJsonValid = false;
      }
    }

    return (
      <div>
        <Row type="flex" justify="center">
          <Col xs={{ span: 23 }} lg={{ span: 23 }}>
            <Card title="One Click Apps">
              <div
                className={
                  self.state.isOneClickAppSelected ? "hide-on-demand" : ""
                }
              >
                <p>
                  Choose an app, a database or a bundle (app+database) from the
                  list below. The rest is magic, well... Wizard!
                </p>
                <p>
                  One click apps are retrieved from :{" "}
                  <NewTabLink url="https://github.com/caprover/one-click-apps">
                    CapRover One Click Apps Repository
                  </NewTabLink>
                </p>
                <OneClickGrid
                  onAppSelectionChanged={appName => {
                    if (appName === TEMPLATE_ONE_CLICK_APP) {
                      self.setState({ isOneClickAppSelected: true });
                    } else {
                      self.props.history.push(`/apps/oneclick/${appName}`);
                    }
                  }}
                  oneClickAppList={self.state.oneClickAppList!}
                />
              </div>
              {Utils.isSafari() ? (
                <Alert
                  message="You seem to be using Safari. Deployment of one-click apps may be unstable on Safari. Using Chrome is recommended"
                  type="warning"
                />
              ) : (
                <div />
              )}
              <div style={{ height: 50 }} />
              <div
                className={
                  self.state.isOneClickAppSelected ? "" : "hide-on-demand"
                }
              >
                <div>
                  <p>
                    This is mainly for testing. You can copy and paste your
                    custom One-Click app template here. See{" "}
                    <NewTabLink url="https://github.com/caprover/one-click-apps/tree/master/public/v2/apps">
                      the main one click apps GitHub repository
                    </NewTabLink>{" "}
                    for samples and ideas.
                  </p>
                </div>

                <Input.TextArea
                  className="code-input"
                  placeholder={`{
  "captainVersion": "2",
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
                <div style={{ height: 10 }} />
                {!isOneClickJsonValid ? (
                  <Alert
                    message="One Click data that you've entered is not a valid JSON."
                    type="error"
                  />
                ) : (
                  <div />
                )}
                <div style={{ height: 30 }} />
                <Row type="flex" justify="space-between" align="middle">
                  <Button
                    onClick={() =>
                      self.props.history.push(
                        `/apps/oneclick/${TEMPLATE_ONE_CLICK_APP}` +
                          (`?${ONE_CLICK_APP_STRINGIFIED_KEY}=` +
                            encodeURIComponent(
                              self.state.templateOneClickAppData
                            ))
                      )
                    }
                    disabled={
                      !self.state.templateOneClickAppData ||
                      !isOneClickJsonValid
                    }
                    style={{ minWidth: 150 }}
                    type="primary"
                  >
                    Next
                  </Button>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}
