import { Button, Col, Icon, Input, message, Row, Tooltip } from "antd";
import React, { Component } from "react";
import DomUtils from "../../../../utils/DomUtils";
import Toaster from "../../../../utils/Toaster";
import { AppDetailsContext } from "../AppDetailsProvider";
import { RepoInfo } from "../../AppDefinition";
import AppLogsView from "./components/AppLogsView";
import AppVersionTable from "./components/AppVersionTable";
import BuildLogsView from "./components/BuildLogsView";
import GitRepoForm from "./components/GitRepoForm";
import TarUploader from "./components/TarUploader";
import UploaderPlainTextCaptainDefinition from "./components/UploaderPlainTextCaptainDefinition";
import UploaderPlainTextDockerfile from "./components/UploaderPlainTextDockerfile";

export default class DeploymentTab extends Component<
{ },
{
  forceEditableCaptainDefinitionPath: boolean;
  buildLogRecreationId: string;
}
> {
  static contextType = AppDetailsContext
  context!: React.ContextType<typeof AppDetailsContext>

  state = {
    forceEditableCaptainDefinitionPath: false,
    buildLogRecreationId: "",
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentWillReceiveProps(next: any, nextContext: any) {
    if (nextContext.building && !this.context.building) {
      message.info("Build has started");
      this.setState({ buildLogRecreationId: "" + new Date().getTime() });
      DomUtils.scrollToTopBar();
    }
  }

  getWebookToken() {
    const { app } = this.context.currentApp();
    const hasPushToken =
      app.appPushWebhook && app.appPushWebhook.pushWebhookToken;

    return hasPushToken && app.appPushWebhook
      ? "/user/apps/webhooks/triggerbuild?namespace=captain&token=" +
        app.appPushWebhook.pushWebhookToken
      : "";
  }

  onForceBuild = () => {
    try {
      this.context
        .forceBuild(this.getWebookToken());
    }
    catch (err) {
      Toaster.toast(err);
    }
  }

  onGitRepoUpdate = (newRepo: RepoInfo) => {
    const { app } = this.context.currentApp();

    this.context.updateAppDefintion({
      appPushWebhook: {
        ...(app.appPushWebhook || {}),
        newRepo,
      },
    });
  }

  onUpdateCaptainPath = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.context.updateAppDefintion({ captainDefinitionRelativeFilePath: e.target.value });
  }

  render() {
    const { app } = this.context.currentApp();
    const { isMobile } = this.context;
    const hasPushToken =
      app.appPushWebhook && app.appPushWebhook.pushWebhookToken;
    const repoInfo = app.appPushWebhook
      ? app.appPushWebhook.repoInfo
      : {
        user: "",
        password: "",
        branch: "",
        sshKey: "",
        repo: "",
      };

    const webhookPushUrlRelativePath = this.getWebookToken();

    const webhookPushUrlFullPath =
      window.location.protocol +
      "//captain." +
      this.context.rootDomain +
      "/api/v2" +
      webhookPushUrlRelativePath;

    return (
      <div>
        <BuildLogsView
          buildLogRecreationId={this.state.buildLogRecreationId}
          key={(app.appName || "") + "-" + this.state.buildLogRecreationId}
        />
        <div style={{ height: 20 }} />
        <hr />
        <div style={{ height: 20 }} />

        <AppVersionTable />

        <div style={{ height: 20 }} />
        <AppLogsView />

        <hr />
        <div style={{ height: 40 }} />
        <h4>
          <Icon type="rocket" /> Method 1: Official CLI
        </h4>
        <p>
          Use CLI deploy command. This is the easiest method as it only requires
          a simply command like <code>caprover deploy</code>. Read more about it
          in the{" "}
          <a
            href="https://caprover.com/docs/get-started.html#step-4-deploy-the-test-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            docs
          </a>
        </p>
        <div style={{ height: 20 }} />
        <h4>
          <Icon type="rocket" /> Method 2: Tarball
        </h4>
        <p>
          You can simply create a tarball (<code>.tar</code>) of your project
          and upload it here via upload button.
        </p>

        <TarUploader />

        <div style={{ height: 40 }} />
        <h4>
          <Icon type="rocket" /> Method 3: Deploy from Github/Bitbucket/Gitlab
        </h4>
        <p>
          Enter your repository information in the form and save. Then copy the
          URL in the box as a webhook on Github, Bitbucket, Gitlab and etc. Once
          you push a commit, CapRover starts a new build.
          <br />
        </p>
        <Row>
          <Input
            onFocus={e => {
              if (hasPushToken) {
                e.target.select();
                document.execCommand("copy");
                message.info("Copied to clipboard!");
              }
            }}
            className="code-input"
            readOnly={true}
            disabled={!hasPushToken}
            defaultValue={
              hasPushToken
                ? webhookPushUrlFullPath
                : "** Add repo info and save for this webhook to appear **"
            }
          />
        </Row>
        <br />
        <GitRepoForm
          gitRepoValues={repoInfo}
          updateRepoInfo={this.onGitRepoUpdate}
        />
        <Row
          type="flex"
          justify="end"
          style={{ marginTop: isMobile ? 15 : 0 }}
        >
          <Button
            disabled={!hasPushToken}
            style={{ marginRight: isMobile ? 0 : 10 }}
            block={isMobile}
            onClick={this.onForceBuild}
          >
            Force Build
          </Button>
          <Button
            disabled={!repoInfo.repo}
            type="primary"
            style={{ marginTop: isMobile ? 15 : 0 }}
            block={isMobile}
            onClick={() => this.context.save()}
          >
            Save &amp; Update
          </Button>
        </Row>
        <div style={{ height: 20 }} />
        <h4>
          <Icon type="rocket" /> Method 4: Deploy plain Dockerfile
        </h4>

        <UploaderPlainTextDockerfile />

        <div style={{ height: 20 }} />
        <h4>
          <Icon type="rocket" /> Method 5: Deploy captain-definition file
        </h4>

        <UploaderPlainTextCaptainDefinition />

        <div style={{ height: 20 }} />

        <Row>
          <Col
            xs={{ span: 24 }}
            lg={{ span: 6 }}
            style={{ width: isMobile ? "100%" : 400 }}
          >
            {isMobile && "captain-definition Relative Path"}
            <Input
              addonBefore={
                !isMobile && "captain-definition Relative Path"
              }
              type="text"
              defaultValue={app.captainDefinitionRelativeFilePath + ""}
              disabled={!this.state.forceEditableCaptainDefinitionPath}
              onChange={this.onUpdateCaptainPath}
            />
          </Col>

          <Col xs={{ span: 24 }} lg={{ span: 12 }}>
            <div
              style={{
                paddingLeft: isMobile ? 0 : 24,
                marginTop: isMobile ? 8 : 0,
              }}
            >
              <Tooltip title="You shouldn't need to change this path unless you have a repository with multiple captain-definition files (mono repos). Read docs for captain definition before editing this">
                <Button
                  type="default"
                  block={isMobile}
                  disabled={this.state.forceEditableCaptainDefinitionPath}
                  onClick={() =>
                    this.setState({ forceEditableCaptainDefinitionPath: true })
                  }
                >
                  Edit
                </Button>
              </Tooltip>
              <Button
                style={{
                  marginLeft: isMobile ? 0 : 20,
                  marginTop: isMobile ? 8 : 0,
                }}
                block={isMobile}
                disabled={!this.state.forceEditableCaptainDefinitionPath}
                type="primary"
                onClick={() => this.context.save()}
              >
                Save &amp; Update
              </Button>
            </div>
          </Col>

          <Col span={6} />
        </Row>
      </div>
    );
  }
}
