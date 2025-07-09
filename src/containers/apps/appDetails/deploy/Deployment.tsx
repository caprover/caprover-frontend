import { RocketOutlined } from '@ant-design/icons'
import { Button, Col, Input, message, Row, Tooltip } from 'antd'
import deepEqual from 'deep-equal'
import DomUtils from '../../../../utils/DomUtils'
import { localize } from '../../../../utils/Language'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import NewTabLink from '../../../global/NewTabLink'
import { IAppDef, IAppVersion, RepoInfo } from '../../AppDefinition'
import { AppDetailsTabProps } from '../AppDetails'
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
        message.info(localize('apps.deploy_build_started', 'Build has started'))
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
                throw new Error(
                    localize('apps.deploy_app_not_found', 'App not found!')
                )
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

        const webhookPushUrlFullPath = `${window.location.protocol}//${this.props.apiData.captainSubDomain}.${this.props.apiData.rootDomain}/api/v2${webhookPushUrlRelativePath}`

        const cliDescription = (
            <div>
                {Utils.formatText(
                    localize(
                        'apps.deploy_cli_description_part1',
                        'Use CLI deploy command. This is the easiest method as it only requires a simple command like %s. Read more about it in the docs'
                    ),
                    ['%s'],
                    [<code>caprover deploy</code>]
                )}{' '}
                <NewTabLink url="https://caprover.com/docs/get-started.html#step-4-deploy-the-test-app">
                    {localize('apps.link_see_here', '(here)')}
                </NewTabLink>
                .{' '}
                {localize(
                    'apps.deploy_cli_description_part2',
                    "If you're using CI/CD to run <code>caprover deploy</code> and you do not wish to use your password, you can use app-specific tokens"
                )}{' '}
                <NewTabLink url="https://caprover.com/docs/ci-cd-integration.html#app-tokens">
                    {localize('apps.link_see_here', '(here)')}
                </NewTabLink>
                .
            </div>
        )

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

                <hr />
                <div style={{ height: 40 }} />
                <h4>
                    <RocketOutlined />
                    {localize(
                        'apps.deploy_method_cli',
                        'Method 1: Official CLI'
                    )}
                </h4>
                <p>{cliDescription}</p>
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
                                ? localize(
                                      'apps.deploy_button_disable_app_token',
                                      'Disable App Token'
                                  )
                                : localize(
                                      'apps.deploy_button_enable_app_token',
                                      'Enable App Token'
                                  )}
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
                                    message.info(
                                        localize(
                                            'apps.deploy_copied_to_clipboard',
                                            'Copied to clipboard!'
                                        )
                                    )
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
                                    : '** ' +
                                      localize(
                                          'apps.deploy_app_token_description',
                                          'Enable App Token to generate a random app token'
                                      ) +
                                      ' **'
                            }
                        />
                    </Col>
                </Row>
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined />
                    {localize(
                        'apps.deploy_method_tarball',
                        'Method 2: Tarball'
                    )}
                </h4>
                <p>
                    {Utils.formatText(
                        localize(
                            'apps.deploy_tarball_description',
                            'You can simply create a tarball (%s) of your project and upload it here via upload button.'
                        ),
                        ['%s'],
                        [
                            <span>
                                <code>.tar file</code>
                            </span>,
                        ]
                    )}
                </p>

                <TarUploader
                    onUploadSucceeded={() => self.onUploadSuccess()}
                    appName={app.appName!}
                />

                <div style={{ height: 40 }} />
                <h4>
                    <RocketOutlined />
                    {localize(
                        'apps.deploy_method_github',
                        'Method 3: Deploy from Github/Bitbucket/Gitlab'
                    )}
                </h4>
                <p>
                    {localize(
                        'apps.deploy_method_github_description',
                        'Enter your repository information in the form and save. Then copy the URL in the box as a webhook on Github, Bitbucket, Gitlab and etc. Once you push a commit, CapRover starts a new build.'
                    )}
                    <br />
                </p>
                <Row>
                    <Input
                        onFocus={(e) => {
                            if (hasPushToken) {
                                e.target.select()
                                document.execCommand('copy')
                                message.info(
                                    localize(
                                        'apps.deploy_copied_to_clipboard',
                                        'Copied to clipboard!'
                                    )
                                )
                            }
                        }}
                        className="code-input"
                        readOnly={true}
                        disabled={!hasPushToken}
                        value={
                            hasPushToken
                                ? webhookPushUrlFullPath
                                : '** ' +
                                  localize(
                                      'apps.deploy_method_github_url_hint',
                                      'Add repo info and save for this webhook to appear'
                                  ) +
                                  ' **'
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
                                tokenVersion: '',
                                pushWebhookToken: '',
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
                        style={{
                            marginInlineEnd: this.props.isMobile ? 0 : 10,
                        }}
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
                        {localize(
                            'apps.deploy_force_build_button',
                            'Force build'
                        )}
                    </Button>
                    <Button
                        disabled={deepEqual(repoInfo, self.initRepoInfo)}
                        type="primary"
                        style={{ marginTop: this.props.isMobile ? 15 : 0 }}
                        block={this.props.isMobile}
                        onClick={() => self.props.onUpdateConfigAndSave()}
                    >
                        {localize('apps.edit_app_config', 'Save & Restart')}
                    </Button>
                </Row>
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined />
                    {localize(
                        'apps.deploy_method_dockerfile',
                        'Method 4: Deploy plain Dockerfile'
                    )}
                </h4>
                <UploaderPlainTextDockerfile
                    appName={app.appName!}
                    onUploadSucceeded={() => self.onUploadSuccess()}
                />
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined />
                    {localize(
                        'apps.deploy_method_captain_definition',
                        'Method 5: Deploy captain-definition file'
                    )}
                </h4>
                <UploaderPlainTextCaptainDefinition
                    appName={app.appName!}
                    onUploadSucceeded={() => self.onUploadSuccess()}
                />
                <div style={{ height: 20 }} />
                <h4>
                    <RocketOutlined />
                    {localize(
                        'apps.deploy_method_image_name',
                        'Method 6: Deploy via ImageName'
                    )}
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
                            localize(
                                'apps.deploy_captain_definition_relative_path_hint',
                                'captain-definition path'
                            )}

                        <Tooltip
                            title={localize(
                                'apps.deploy_captain_definition_relative_path_hint_tooltip',
                                'Edit only if you have placed your captain-definition file in a subdirectory of your project'
                            )}
                        >
                            <Input
                                addonBefore={
                                    !this.props.isMobile &&
                                    localize(
                                        'apps.deploy_captain_definition_relative_path_hint',
                                        'captain-definition path'
                                    )
                                }
                                type="text"
                                defaultValue={
                                    app.captainDefinitionRelativeFilePath + ''
                                }
                                disabled={
                                    !this.state
                                        .forceEditableCaptainDefinitionPath
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
                        </Tooltip>
                    </Col>
                    <Col xs={{ span: 24 }} lg={{ span: 12 }}>
                        <div
                            style={{
                                marginInlineStart: this.props.isMobile ? 0 : 24,
                                marginTop: this.props.isMobile ? 8 : 0,
                            }}
                        >
                            <Tooltip
                                title={localize(
                                    'apps.deploy_captain_definition_path_hint',
                                    "You shouldn't need to change this path unless you have a repository with multiple captain-definition files (mono repos). Read docs for captain definition before editing this"
                                )}
                            >
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
                                    {localize(
                                        'apps.generic_edit_button',
                                        'Edit'
                                    )}
                                </Button>
                            </Tooltip>
                            <Button
                                style={{
                                    marginInlineStart: this.props.isMobile
                                        ? 0
                                        : 20,
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
                                {localize(
                                    'apps.edit_app_config',
                                    'Save & Restart'
                                )}
                            </Button>
                        </div>
                    </Col>

                    <Col span={6} />
                </Row>
            </div>
        )
    }
}
