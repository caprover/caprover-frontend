import React, { Component, Fragment } from "react";
import {
  message,
  Row,
  Button,
  Input,
  Col,
  Icon,
  Tooltip,
  Checkbox,
  Modal
} from "antd";
import Toaster from "../../../utils/Toaster";
import Utils from "../../../utils/Utils";
import { AppDetailsTabProps } from "./AppDetails";

const Search = Input.Search;

export default class HttpSettings extends Component<
  AppDetailsTabProps,
  {
    newDomain: string;
    dialogHttpUser: string;
    dialogHttpPass: string;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      newDomain: "",
      dialogHttpUser: "",
      dialogHttpPass: ""
    };
  }

  render() {
    return <div>{this.createHttpSettingsContent()}</div>;
  }

  reFetchData() {
    this.props.reFetchData();
  }

  enableDefaultHttps() {
    this.props.setLoading(true);

    return Promise.resolve()
      .then(() => {
        return this.props.apiManager.enableSslForBaseDomain(
          this.props.apiData!.appDefinition.appName!
        );
      })
      .then(() => {
        message.success("HTTPS is now enabled for your app");
      })
      .then(() => {
        this.reFetchData();
      })
      .catch(
        Toaster.createCatcher(() => {
          this.props.setLoading(false);
        })
      );
  }

  onConnectNewDomainClicked(newDomain: string) {
    this.props.setLoading(true);

    return Promise.resolve()
      .then(() => {
        return this.props.apiManager.attachNewCustomDomainToApp(
          this.props.apiData!.appDefinition.appName!,
          newDomain
        );
      })
      .then(() => {
        message.success("New domain is now successfully connected!");
      })
      .then(() => {
        this.reFetchData();
      })
      .catch(
        Toaster.createCatcher(() => {
          this.props.setLoading(false);
        })
      );
  }

  onEnableCustomDomainSslClicked(customDomain: string) {
    this.props.setLoading(true);

    return Promise.resolve()
      .then(() => {
        return this.props.apiManager.enableSslForCustomDomain(
          this.props.apiData!.appDefinition.appName!,
          customDomain
        );
      })
      .then(() => {
        message.success("HTTPS is successfully activated for your domain!");
      })
      .then(() => {
        this.reFetchData();
      })
      .catch(
        Toaster.createCatcher(() => {
          this.props.setLoading(false);
        })
      );
  }

  onRemoveCustomDomainClicked(customDomain: string) {
    this.props.setLoading(true);

    return Promise.resolve()
      .then(() => {
        return this.props.apiManager.removeCustomDomain(
          this.props.apiData!.appDefinition.appName!,
          customDomain
        );
      })
      .then(() => {
        message.success("Your custom domain is successfully removed!");
      })
      .then(() => {
        this.reFetchData();
      })
      .catch(
        Toaster.createCatcher(() => {
          this.props.setLoading(false);
        })
      );
  }

  createCustomDomainRows() {
    const customDomains = this.props.apiData!.appDefinition.customDomain || [];

    const rows: JSX.Element[] = [];
    customDomains.forEach(c => {
      const row = (
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
      );
      rows.push(row);
    });

    return rows;
  }

  onEditDefaultNginxConfigClicked() {
    const newApiData = Utils.copyObject(this.props.apiData!);
    newApiData.appDefinition.customNginxConfig = this.props.apiData!.defaultNginxConfig;
    this.props.updateApiData(newApiData);
  }

  createCustomNginx() {
    const customNginxConfig = this.props.apiData!.appDefinition
      .customNginxConfig!;
    if (!customNginxConfig) {
      return (
        <div>
          <Button
            type="default"
            onClick={() => this.onEditDefaultNginxConfigClicked()}
          >
            Edit Default Nginx Configurations
          </Button>
        </div>
      );
    }

    return (
      <div>
        <p>
          Templates are built using EJS template pattern. Do not change the
          areas between <code>&lt;%</code> and <code>%&gt;</code> , unless you
          really know what you're doing! To revert to default, simply remove all
          the content.
        </p>
        <Input.TextArea
          style={{
            fontFamily: "monospace"
          }}
          onChange={e => {
            const newApiData = Utils.copyObject(this.props.apiData!);
            newApiData.appDefinition.customNginxConfig = e.target.value;
            this.props.updateApiData(newApiData);
          }}
          rows={17}
          defaultValue={customNginxConfig}
        />
      </div>
    );
  }

  createHttpDetailsSettingsContent() {
    const app = this.props.apiData!.appDefinition;
    const rootDomain = this.props.apiData!.rootDomain;
    const basicAuthUsername = this.props.apiData.appDefinition.httpAuth
      ? this.props.apiData.appDefinition.httpAuth.user
      : "";

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
                block={this.props.isMobile}
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
              marginLeft: 20
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
        {this.createCustomDomainRows()}
        <br />
        <Row>
          <Col xs={{ span: 24 }} lg={{ span: 15 }}>
            {this.props.isMobile ? (
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
              <Search
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

        <br />
        <br />
        {this.createCustomNginx()}
        <br />
        <br />

        <Row>
          <Col
            xs={{ span: 24 }}
            lg={{ span: 6 }}
            style={{ width: this.props.isMobile ? "100%" : 300 }}
          >
            <Tooltip title="HTTP port inside the container. Default is 80. Change only if the app is running in a different port. This is used only for HTTP apps, not databases.">
              <Input
                addonBefore={`Container ${
                  this.props.isMobile ? " " : "HTTP "
                }Port`}
                type="number"
                defaultValue={
                  app.containerHttpPort ? app.containerHttpPort + "" : ""
                }
                onChange={e => {
                  const newApiData = Utils.copyObject(this.props.apiData);
                  newApiData.appDefinition.containerHttpPort = Number(
                    e.target.value
                  );
                  this.props.updateApiData(newApiData);
                }}
              />
            </Tooltip>
          </Col>
        </Row>

        <br />
        <br />

        <Row>
          <Checkbox
            defaultChecked={!!this.props.apiData.appDefinition.forceSsl}
            onChange={(e: any) => {
              const newApiData = Utils.copyObject(this.props.apiData!);
              newApiData.appDefinition.forceSsl = !!e.target.checked;
              this.props.updateApiData(newApiData);
            }}
          >
            Force HTTPS by redirecting all HTTP traffic to HTTPS
          </Checkbox>
          <Tooltip title="Forcing HTTPS causes domains without HTTPS to malfunction. Make sure you enable HTTPS for the domain you want to use, before enabling Force HTTPS option.">
            <Icon type="info-circle" />
          </Tooltip>
        </Row>
        <br />
        <br />

        <Row>
          <Checkbox
            defaultChecked={!!this.props.apiData.appDefinition.websocketSupport}
            onChange={(e: any) => {
              const newApiData = Utils.copyObject(this.props.apiData!);
              newApiData.appDefinition.websocketSupport = !!e.target.checked;
              this.props.updateApiData(newApiData);
            }}
          >
            Websocket Support
          </Checkbox>
          <Tooltip title="Adds the upgrade proxy headers to NGINX config.">
            <Icon type="info-circle" />
          </Tooltip>
        </Row>
        <br />
        <br />
        <Row>
          <Button
            style={{ marginRight: 20 }}
            type="default"
            onClick={() => this.onEditHttpAuthClicked()}
          >
            Edit HTTP Basic Auth
          </Button>
          {this.props.isMobile && <div style={{ marginTop: 10 }} />}
          <span>
            Current State: <b>{!basicAuthUsername ? "inactive" : "active"}</b>{" "}
            {basicAuthUsername
              ? `[user: ${basicAuthUsername} @ password: <HIDDEN>]`
              : ""}
          </span>
        </Row>
      </div>
    );
  }

  onEditHttpAuthClicked() {
    const IGNORE = "IGNORE";
    const CONFIRM = "CONFIRM";

    const auth = this.props.apiData.appDefinition.httpAuth;

    this.setState({
      dialogHttpPass: auth ? auth.password || "" : "",
      dialogHttpUser: auth ? auth.user || "" : ""
    });

    Promise.resolve()
      .then(() => {
        return new Promise((resolve, reject) => {
          Modal.confirm({
            title: "Edit HTTP Basic Auth",
            content: (
              <div style={{ paddingTop: 30 }}>
                <p>
                  HTTP Basic authentication is the simplest technique for
                  enforcing access controls to web resources.
                </p>
                <p>
                  You can use this technique to restrict access to HTTP apps,
                  specially those you create via One-Click app generator such as
                  phpMyAdmin and etc.
                </p>
                <p>
                  <Input
                    placeholder="username"
                    type="text"
                    defaultValue={this.state.dialogHttpUser}
                    onChange={event =>
                      this.setState({
                        dialogHttpUser: (event.target.value || "").trim()
                      })
                    }
                  />
                </p>
                <p>
                  <Input
                    placeholder="password"
                    type="text"
                    defaultValue={this.state.dialogHttpPass}
                    onChange={event =>
                      this.setState({
                        dialogHttpPass: (event.target.value || "").trim()
                      })
                    }
                  />
                </p>
              </div>
            ),
            onOk() {
              resolve(CONFIRM);
            },
            onCancel() {
              resolve(IGNORE);
            }
          });
        });
      })
      .then((data: any) => {
        if (data === IGNORE) return;

        const newApiData = Utils.copyObject(this.props.apiData);
        const enteredUser = this.state.dialogHttpUser;
        const enteredPassword = this.state.dialogHttpPass;

        if (!enteredUser || !enteredPassword) {
          newApiData.appDefinition.httpAuth = undefined;
        } else {
          newApiData.appDefinition.httpAuth = newApiData.appDefinition
            .httpAuth || { user: "" };

          newApiData.appDefinition.httpAuth.user = enteredUser;
          newApiData.appDefinition.httpAuth.password = enteredPassword;
        }

        this.props.updateApiData(newApiData);

        // Make sure state is saved!
        return Utils.getDelayedPromise(300) //
          .then(() => {
            this.props.onUpdateConfigAndSave();
          });
      });
  }

  createHttpSettingsContent() {
    const app = this.props.apiData!.appDefinition;
    return (
      <div>
        <p>
          Your app is internally available as{" "}
          <code>srv-captain--{app.appName}</code> to other Captain apps. In case
          of web-app, it is accessible via{" "}
          <code>{"http://srv-captain--" + app.appName}</code> from other apps.
        </p>
        <br />

        <Checkbox
          defaultChecked={this.props.apiData!.appDefinition.notExposeAsWebApp}
          onChange={(e: any) => {
            const newApiData = Utils.copyObject(this.props.apiData!);
            newApiData.appDefinition.notExposeAsWebApp = !!e.target.checked;
            this.props.updateApiData(newApiData);
          }}
        >
          Do not expose as web-app
        </Checkbox>
        <Tooltip title="Use this if you don't want your app be externally available.">
          <Icon type="info-circle" />
        </Tooltip>

        <div style={{ height: 35 }} />
        {app.notExposeAsWebApp ? (
          <div />
        ) : (
          this.createHttpDetailsSettingsContent()
        )}
      </div>
    );
  }
}
