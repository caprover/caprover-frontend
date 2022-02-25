import { DownCircleOutlined, RocketOutlined, UpCircleOutlined } from '@ant-design/icons'
import { Button, Col, Input, message, Row, Tooltip } from 'antd'
import deepEqual from 'deep-equal'
import React from 'react'
import DomUtils from '../../../../utils/DomUtils'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import ClickableLink from '../../../global/ClickableLink'
import NewTabLink from '../../../global/NewTabLink'
import { IAppDef, IAppVersion, RepoInfo } from '../../AppDefinition'
import { AppDetailsTabProps } from '../AppDetails'
import AppLogsView from './AppLogsView'
import AppVersionTable from './AppVersionTable'
import BuildLogsView from './BuildLogsView'
import GitRepoForm from './GitRepoForm'
import TarUploader from './TarUploader'
import UploaderPlainTextCaptainDefinition from './UploaderPlainTextCaptainDefinition'
import UploaderPlainTextDockerfile from './UploaderPlainTextDockerfile'
import UploaderPlainTextImageName from './UploaderPlainTextImageName'

export default class Deployment extends ApiComponent<
    AppDetailsTabProps,
    {
        dummyVar: undefined
        forceEditableCaptainDefinitionPath: boolean
        buildLogRecreationId: string
        updatedVersions:
            | { versions: IAppVersion[]; deployedVersion: number }
            | undefined
        expandedMethod1: boolean
        expandedMethod2: boolean
        expandedMethod3: boolean
        expandedMethod4: boolean
        expandedMethod5: boolean
        expandedMethod6: boolean
    }
> {
    initRepoInfo: RepoInfo

    constructor(props: AppDetailsTabProps) {
        super(props)
        this.state = {
            dummyVar: undefined,
            forceEditableCaptainDefinitionPath: false,
            updatedVersions: undefined,
            buildLogRecreationId: '',
            expandedMethod1: false,
            expandedMethod2: false,
            expandedMethod3: false,
            expandedMethod4: false,
            expandedMethod5: false,
            expandedMethod6: false,
        }

        const { appPushWebhook } = props.apiData.appDefinition
        this.initRepoInfo = appPushWebhook
            ? { ...appPushWebhook.repoInfo }
            : {
                  user: '',
                  password: '',
                  branch: '',
                  sshKey: '',
                  repo: '',
              }
    }

    onUploadSuccess() {
        message.info('Build has started')
        this.setState({ buildLogRecreationId: `${new Date().getTime()}` })
        DomUtils.scrollToTopBar()
    }

    onAppBuildFinished() {
        const self = this
        self.apiManager
            .getAllApps()
            .then(function (data) {
                const appDefs = data.appDefinitions as IAppDef[]
                for (let index = 0; index < appDefs.length; index++) {
                    const element = appDefs[index]
                    if (
                        element.appName ===
                        self.props.apiData.appDefinition.appName
                    ) {
                        return Utils.copyObject(element)
                    }
                }
                throw new Error('App not found!')
            })
            .then(function (app) {
                self.setState({
                    updatedVersions: {
                        deployedVersion: app.deployedVersion,
                        versions: app.versions,
                    },
                })
            })
            .catch(Toaster.createCatcher())
    }

    onVersionRollbackRequested(version: IAppVersion) {
        const self = this
        self.apiManager
            .uploadCaptainDefinitionContent(
                self.props.apiData.appDefinition.appName!,
                {
                    schemaVersion: 2,
                    // We should use imageName, but since imageName does not report build failure (since there is no build!)
                    // If we use that, and the image is not available, the service will not work.
                    dockerfileLines: [`FROM ${version.deployedImageName}`],
                },
                version.gitHash || '',
                true
            )
            .then(function () {
                self.onUploadSuccess()
            })
            .catch(Toaster.createCatcher())
    }

    onExpandMethodClick(method: number) {
        switch (method)
        {
            case 1:
                this.setState({ expandedMethod1: !this.state.expandedMethod1 })
                break;
            case 2:
                this.setState({ expandedMethod2: !this.state.expandedMethod2 })
                break;
            case 3:
                this.setState({ expandedMethod3: !this.state.expandedMethod3 })
                break;
            case 4:
                this.setState({ expandedMethod4: !this.state.expandedMethod4 })
                break;
            case 5:
                this.setState({ expandedMethod5: !this.state.expandedMethod5 })
                break;
            case 6:
                this.setState({ expandedMethod6: !this.state.expandedMethod6 })
                break;
        }
    }

    render() {
        const self = this
        const app = this.props.apiData.appDefinition
        const hasPushToken =
            app.appPushWebhook && app.appPushWebhook.pushWebhookToken
        const repoInfo = app.appPushWebhook
            ? app.appPushWebhook.repoInfo
            : {
                  user: '',
                  password: '',
                  branch: '',
                  sshKey: '',
                  repo: '',
              }

        const webhookPushUrlRelativePath = hasPushToken
            ? `/user/apps/webhooks/triggerbuild?namespace=captain&token=${
                  app.appPushWebhook!.pushWebhookToken
              }`
            : ''

        const webhookPushUrlFullPath = `${window.location.protocol}//${this.props.apiData.captainSubDomain}.${this.props.apiData.rootDomain}/api/v2${webhookPushUrlRelativePath}`

        return (
            <div>
                <BuildLogsView
                    onAppBuildFinished={() => self.onAppBuildFinished()}
                    appName={app.appName!}
                    buildLogRecreationId={self.state.buildLogRecreationId}
                    key={`${app.appName!}-${self.state.buildLogRecreationId}`}
                />
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />

                <AppVersionTable
                    isMobile={this.props.isMobile}
                    onVersionRollbackRequested={(versionToRevert) =>
                        self.onVersionRollbackRequested(versionToRevert)
                    }
                    versions={
                        self.state.updatedVersions
                            ? self.state.updatedVersions.versions
                            : app.versions
                    }
                    deployedVersion={
                        self.state.updatedVersions
                            ? self.state.updatedVersions.deployedVersion
                            : app.deployedVersion
                    }
                />

                <div style={{ height: 20 }} />
                <AppLogsView
                    appName={app.appName!}
                    key={app.appName! + '-LogsView'}
                />
                
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 40 }} />
                <ClickableLink
                        onLinkClicked={() => {
                            self.onExpandMethodClick(1)
                        }}
                    >
                    
                    <h4 className="unselectable-span">
                        {this.state.expandedMethod1 ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )}

                        <span style={{ marginLeft: 5, marginRight: 5 }}>Method 1: Official CLI</span>

                        <RocketOutlined />
                    </h4>
                </ClickableLink>
                <div  className={
                            this.state.expandedMethod1
                                ? ''
                                : 'hide-on-demand'
                        }>
                    <p>
                        Use CLI deploy command. This is the easiest method as it
                        only requires a simply command like{' '}
                        <code>caprover deploy</code>. Read more about it in{' '}
                        <NewTabLink url="https://caprover.com/docs/get-started.html#step-4-deploy-the-test-app">
                            the docs
                        </NewTabLink>
                        . If you're using CI/CD to run <code>caprover deploy</code>{' '}
                        and you do not wish to use your password, you can use{' '}
                        <NewTabLink url="https://caprover.com/docs/ci-cd-integration.html#app-tokens">
                            app-specific tokens
                        </NewTabLink>
                        .
                    </p>
                    <Row
                        justify="start"
                        style={{ marginTop: this.props.isMobile ? 15 : 0 }}
                    >
                        <Col flex="0">
                            <Button
                                style={{
                                    margin: 5,
                                }}
                                block={this.props.isMobile}
                                onClick={() => {
                                    const newApiData = Utils.copyObject(
                                        this.props.apiData
                                    )
                                    let tokenConfig =
                                        newApiData.appDefinition
                                            .appDeployTokenConfig
                                    if (!tokenConfig) {
                                        tokenConfig = {
                                            enabled: false,
                                        }
                                    }
                                    tokenConfig.enabled = !tokenConfig.enabled
                                    newApiData.appDefinition.appDeployTokenConfig =
                                        tokenConfig
                                    self.props.updateApiData(newApiData)
                                    // This is a hack! Find a better way!
                                    // We need this delay, otherwise the new state will not be used by onUpdateConfigAndSave
                                    setTimeout(
                                        self.props.onUpdateConfigAndSave,
                                        100
                                    )
                                }}
                            >
                                {app.appDeployTokenConfig?.enabled
                                    ? 'Disable App Token'
                                    : 'Enable App Token'}
                            </Button>
                        </Col>{' '}
                        <Col flex="auto">
                            <Input
                                onFocus={(e) => {
                                    if (
                                        !!app.appDeployTokenConfig?.appDeployToken
                                    ) {
                                        e.target.select()
                                        document.execCommand('copy')
                                        message.info('Copied to clipboard!')
                                    }
                                }}
                                style={{
                                    margin: 5,
                                }}
                                className="code-input"
                                readOnly={true}
                                disabled={!app.appDeployTokenConfig?.appDeployToken}
                                value={
                                    app.appDeployTokenConfig?.enabled
                                        ? app.appDeployTokenConfig?.appDeployToken
                                        : '** Enable App Token to generate a random app token **'
                                }
                            />
                        </Col>
                    </Row>
                </div>
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />
                <ClickableLink
                        onLinkClicked={() => {
                            self.onExpandMethodClick(2)
                        }}
                    >
                    
                    <h4 className="unselectable-span">
                        {this.state.expandedMethod2 ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )}

                        <span style={{ marginLeft: 5, marginRight: 5 }}>Method 2: Tarball</span>

                        <RocketOutlined />
                    </h4>
                </ClickableLink>
                <div  className={
                            this.state.expandedMethod2
                                ? ''
                                : 'hide-on-demand'
                        }>
                    <p>
                        You can simply create a tarball (<code>.tar</code>) of your
                        project and upload it here via upload button.
                    </p>

                    <TarUploader
                        onUploadSucceeded={() => self.onUploadSuccess()}
                        appName={app.appName!}
                    />
                </div>

                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />
                
                <ClickableLink
                        onLinkClicked={() => {
                            self.onExpandMethodClick(3)
                        }}
                    >
                    
                    <h4 className="unselectable-span">
                        {this.state.expandedMethod3 || hasPushToken ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )}

                        <span style={{ marginLeft: 5, marginRight: 5 }}>Method 3: Deploy from Github/Bitbucket/Gitlab</span>

                        <RocketOutlined />
                    </h4>
                </ClickableLink>
                <div  className={
                            this.state.expandedMethod3 || hasPushToken
                                ? ''
                                : 'hide-on-demand'
                        }>
                    <p>
                        Enter your repository information in the form and save. Then
                        copy the URL in the box as a webhook on Github, Bitbucket,
                        Gitlab and etc. Once you push a commit, CapRover starts a
                        new build.
                        <br />
                    </p>
                    <Row>
                        <Input
                            onFocus={(e) => {
                                if (hasPushToken) {
                                    e.target.select()
                                    document.execCommand('copy')
                                    message.info('Copied to clipboard!')
                                }
                            }}
                            className="code-input"
                            readOnly={true}
                            disabled={!hasPushToken}
                            value={
                                hasPushToken
                                    ? webhookPushUrlFullPath
                                    : '** Add repo info and save for this webhook to appear **'
                            }
                        />
                    </Row>
                    <br />
                    <GitRepoForm
                        gitRepoValues={repoInfo}
                        updateRepoInfo={(newRepo) => {
                            const newApiData = Utils.copyObject(this.props.apiData)
                            if (newApiData.appDefinition.appPushWebhook) {
                                newApiData.appDefinition.appPushWebhook.repoInfo =
                                    Utils.copyObject(newRepo)
                            } else {
                                newApiData.appDefinition.appPushWebhook = {
                                    repoInfo: Utils.copyObject(newRepo),
                                }
                            }
                            this.props.updateApiData(newApiData)
                        }}
                    />
                    <Row
                        justify="end"
                        style={{ marginTop: this.props.isMobile ? 15 : 0 }}
                    >
                        <Button
                            disabled={!hasPushToken}
                            style={{ marginRight: this.props.isMobile ? 0 : 10 }}
                            block={this.props.isMobile}
                            onClick={() => {
                                self.apiManager
                                    .forceBuild(webhookPushUrlRelativePath)
                                    .then(function () {
                                        self.onUploadSuccess()
                                    })
                                    .catch(Toaster.createCatcher())
                            }}
                        >
                            Force Build
                        </Button>
                        <Button
                            disabled={deepEqual(repoInfo, self.initRepoInfo)}
                            type="primary"
                            style={{ marginTop: this.props.isMobile ? 15 : 0 }}
                            block={this.props.isMobile}
                            onClick={() => self.props.onUpdateConfigAndSave()}
                        >
                            Save &amp; Update
                        </Button>
                    </Row>
                </div>
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />
                
                <ClickableLink
                        onLinkClicked={() => {
                            self.onExpandMethodClick(4)
                        }}
                    >
                    
                    <h4 className="unselectable-span">
                        {this.state.expandedMethod4 ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )}

                        <span style={{ marginLeft: 5, marginRight: 5 }}>Method 4: Deploy plain Dockerfile</span>

                        <RocketOutlined />
                    </h4>
                </ClickableLink>
                <div  className={
                            this.state.expandedMethod4
                                ? ''
                                : 'hide-on-demand'
                        }>
                    <UploaderPlainTextDockerfile
                        appName={app.appName!}
                        onUploadSucceeded={() => self.onUploadSuccess()}
                    />
                </div>
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />

                <ClickableLink
                        onLinkClicked={() => {
                            self.onExpandMethodClick(5)
                        }}
                    >
                    
                    <h4 className="unselectable-span">
                        {this.state.expandedMethod5 ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )}

                        <span style={{ marginLeft: 5, marginRight: 5 }}>Method 5: Deploy captain-definition file</span>

                        <RocketOutlined />
                    </h4>
                </ClickableLink>
                <div  className={
                            this.state.expandedMethod5
                                ? ''
                                : 'hide-on-demand'
                        }>
                    <UploaderPlainTextCaptainDefinition
                        appName={app.appName!}
                        onUploadSucceeded={() => self.onUploadSuccess()}
                    />
                </div>
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />

                <ClickableLink
                        onLinkClicked={() => {
                            self.onExpandMethodClick(6)
                        }}
                    >
                    
                    <h4 className="unselectable-span">
                        {this.state.expandedMethod6 ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )}

                        <span style={{ marginLeft: 5, marginRight: 5 }}>Method 6: Deploy via ImageName</span>

                        <RocketOutlined />
                    </h4>
                </ClickableLink>
                <div  className={
                            this.state.expandedMethod6
                                ? ''
                                : 'hide-on-demand'
                        }>
                    <UploaderPlainTextImageName
                        appName={app.appName!}
                        onUploadSucceeded={() => self.onUploadSuccess()}
                    />
                </div>
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />
                <Row>
                    <Col
                        xs={{ span: 24 }}
                        lg={{ span: 6 }}
                        style={{ minWidth: this.props.isMobile ? '100%' : 400 }}
                    >
                        {this.props.isMobile &&
                            'captain-definition Relative Path'}
                        <Input
                            addonBefore={
                                !this.props.isMobile &&
                                'captain-definition Relative Path'
                            }
                            type="text"
                            defaultValue={
                                app.captainDefinitionRelativeFilePath + ''
                            }
                            disabled={
                                !this.state.forceEditableCaptainDefinitionPath
                            }
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    this.props.apiData
                                )
                                newApiData.appDefinition.captainDefinitionRelativeFilePath =
                                    e.target.value
                                this.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <div
                            style={{
                                paddingLeft: this.props.isMobile ? 0 : 24,
                                marginTop: this.props.isMobile ? 8 : 0,
                            }}
                        >
                            <Tooltip title="You shouldn't need to change this path unless you have a repository with multiple captain-definition files (mono repos). Read docs for captain definition before editing this">
                                <Button
                                    type="default"
                                    block={this.props.isMobile}
                                    disabled={
                                        this.state
                                            .forceEditableCaptainDefinitionPath
                                    }
                                    onClick={() =>
                                        this.setState({
                                            forceEditableCaptainDefinitionPath:
                                                true,
                                        })
                                    }
                                >
                                    Edit
                                </Button>
                            </Tooltip>
                            <Button
                                style={{
                                    marginLeft: this.props.isMobile ? 0 : 20,
                                    marginTop: this.props.isMobile ? 8 : 0,
                                }}
                                block={this.props.isMobile}
                                disabled={
                                    !this.state
                                        .forceEditableCaptainDefinitionPath
                                }
                                type="primary"
                                onClick={() =>
                                    self.props.onUpdateConfigAndSave()
                                }
                            >
                                Save &amp; Update
                            </Button>
                        </div>
                    </Col>

                    <Col span={6} />
                </Row>
            </div>
        )
    }
}
