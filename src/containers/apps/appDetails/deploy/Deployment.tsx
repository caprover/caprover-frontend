import { RocketOutlined } from '@ant-design/icons'
import { Button, Col, Input, message, Row, Tooltip } from 'antd'
import deepEqual from 'deep-equal'
import React from 'react'
import DomUtils from '../../../../utils/DomUtils'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
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

        const webhookPushUrlFullPath = `${window.location.protocol}//captain.${this.props.apiData.rootDomain}/api/v2${webhookPushUrlRelativePath}`

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

                <hr />
                <div style={{ height: 40 }} />
                <h4>
                    <RocketOutlined /> Method 1: Official CLI
                </h4>
                <p>
                    Use CLI deploy command. This is the easiest method as it
                    only requires a simply command like{' '}
                    <code>caprover deploy</code>. Read more about it in the{' '}
                    <NewTabLink url="https://caprover.com/docs/get-started.html#step-4-deploy-the-test-app">
                        docs
                    </NewTabLink>
                </p>
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined /> Method 2: Tarball
                </h4>
                <p>
                    You can simply create a tarball (<code>.tar</code>) of your
                    project and upload it here via upload button.
                </p>

                <TarUploader
                    onUploadSucceeded={() => self.onUploadSuccess()}
                    appName={app.appName!}
                />

                <div style={{ height: 40 }} />
                <h4>
                    <RocketOutlined /> Method 3: Deploy from
                    Github/Bitbucket/Gitlab
                </h4>
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
                            newApiData.appDefinition.appPushWebhook.repoInfo = Utils.copyObject(
                                newRepo
                            )
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
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined /> Method 4: Deploy plain Dockerfile
                </h4>
                <UploaderPlainTextDockerfile
                    appName={app.appName!}
                    onUploadSucceeded={() => self.onUploadSuccess()}
                />
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined /> Method 5: Deploy captain-definition file
                </h4>
                <UploaderPlainTextCaptainDefinition
                    appName={app.appName!}
                    onUploadSucceeded={() => self.onUploadSuccess()}
                />
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined /> Method 6: Deploy via ImageName
                </h4>
                <UploaderPlainTextImageName
                    appName={app.appName!}
                    onUploadSucceeded={() => self.onUploadSuccess()}
                />
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
                                            forceEditableCaptainDefinitionPath: true,
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
