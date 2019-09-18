import React, { Component, Fragment } from "react";
import { Col, Input, Row, Icon, Tooltip, Button, message } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";
import Toaster from "../../../../../utils/Toaster";
import { IAppCustomDomain } from "../../../AppDefinition";

export default class Domains extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>

  state = {
    newDomain: "",
  };

  enableDefaultHttps = async () => {
    try {
      await this.context.enableSslForBaseDomain();
      message.success("HTTPS is now enabled for your app");
    } catch(err) {
      Toaster.toast(err);
    };
  }

  onEnableCustomDomainSslClicked = async (customDomain: string) => {
    try {
      await this.context.enableSslForCustomDomain(customDomain);
      message.success("HTTPS is successfully activated for your domain!");
    } catch(err) {
      Toaster.toast(err);
    };
  }

  onRemoveCustomDomainClicked = async (customDomain: string) => {
    try {
      await this.context.removeCustomDomain(customDomain);
      message.success("Your custom domain is successfully removed!");
    } catch(err) {
      Toaster.toast(err);
    };
  }

  onConnectNewDomainClicked = async (newDomain: string) => {
    try {
      await this.context.addCustomDomain(newDomain);
      message.success("New domain is now successfully connected!");
    } catch(err) {
      Toaster.toast(err);
    };
  }

  render() {
    const { isMobile } = this.context;
    const { app, rootDomain } = this.context.currentApp();
    const customDomains = app.customDomain || [];

    return (
      <div>
        <p>Your app is available to public at:</p>
        <Row>
          <Button.Group size="small">
            <Tooltip
              title={
                app.hasDefaultSubDomainSsl
                  ? "Already activated"
                  : "Click to activate HTTPS for this domain"
              }
            >
              <Button
                disabled={app.hasDefaultSubDomainSsl}
                block={isMobile}
                onClick={() => {
                  this.enableDefaultHttps();
                }}
                type="primary"
              >
                Enable HTTPS
              </Button>
            </Tooltip>
          </Button.Group>
          <a
            style={{
              marginLeft: 20,
            }}
            href={
              "http" +
              (app.hasDefaultSubDomainSsl ? "s" : "") +
              "://" +
              app.appName +
              "." +
              rootDomain
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            {"http" +
              (app.hasDefaultSubDomainSsl ? "s" : "") +
              "://" +
              app.appName +
              "." +
              rootDomain}
          </a>
        </Row>

        {customDomains.map((c: IAppCustomDomain) => (
          <Row key={c.publicDomain} style={{ marginTop: 15 }}>
            <Button.Group size="small">
              <Tooltip
                title={
                  c.hasSsl
                    ? "Already activated"
                    : "Click to activate HTTPS for this domain"
                }
              >
                <Button
                  disabled={c.hasSsl}
                  onClick={() => {
                    this.onEnableCustomDomainSslClicked(c.publicDomain);
                  }}
                  type="primary"
                >
                  Enable HTTPS
                </Button>
              </Tooltip>
              <Button
                style={{ marginRight: 20 }}
                onClick={() => {
                  this.onRemoveCustomDomainClicked(c.publicDomain);
                }}
              >
                Remove
              </Button>
            </Button.Group>

            <a
              target="_blank"
              rel="noopener noreferrer"
              href={"http://" + c.publicDomain}
            >
              {c.publicDomain}
            </a>
          </Row>
        ))}

        <br />
        <Row>
          <Col xs={{ span: 24 }} lg={{ span: 15 }}>
            {isMobile ? (
              <Fragment>
                <Input
                  placeholder="www.the-best-app-in-the-world.com"
                  onChange={e => this.setState({ newDomain: e.target.value })}
                />
                <Button
                  style={{ marginTop: 8 }}
                  block
                  onClick={() =>
                    this.onConnectNewDomainClicked(this.state.newDomain)
                  }
                  type="primary"
                >
                  Connect New Domain
                </Button>
              </Fragment>
            ) : (
              <Input.Search
                placeholder="www.the-best-app-in-the-world.com"
                enterButton="Connect New Domain"
                onSearch={value => this.onConnectNewDomainClicked(value)}
              />
            )}
          </Col>
          &nbsp;&nbsp;&nbsp;
          <Tooltip title="Make sure the new domain points to this IP, otherwise verification will fail.">
            <span>
              <Icon style={{ marginTop: 9 }} type="info-circle" />
            </span>
          </Tooltip>
        </Row>
      </div>
    );
  }
}
