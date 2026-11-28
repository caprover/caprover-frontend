import { DownOutlined, UpOutlined } from '@ant-design/icons'
import {
    Alert,
    Button,
    Card,
    Flex,
    Input,
    message,
    Radio,
    Typography,
} from 'antd'
import deepEqual from 'deep-equal'
import DomUtils from '../../../../utils/DomUtils'
import { localize } from '../../../../utils/Language'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import NewTabLink from '../../../global/NewTabLink'
import Timestamp from '../../../global/Timestamp'
import { IAppDef, IAppVersion, RepoInfo } from '../../AppDefinition'
import { AppDetailsTabProps } from '../AppDetails'
import AppVersionTable from './AppVersionTable'
import BuildLogsView from './BuildLogsView'
import GitRepoForm, {
    createGitRepoDraft,
    getGitRepoInfoForSave,
    GitRepoDraft,
} from './GitRepoForm'
import TarUploader from './TarUploader'
import UploaderPlainTextCaptainDefinition from './UploaderPlainTextCaptainDefinition'
import UploaderPlainTextDockerfile from './UploaderPlainTextDockerfile'
import UploaderPlainTextImageName from './UploaderPlainTextImageName'

enum ManualMethod {
    Archive = 'archive',
    Image = 'image',
    Dockerfile = 'dockerfile',
    Definition = 'definition',
}

const EMPTY_REPO: RepoInfo = {
    user: '',
    password: '',
    branch: '',
    sshKey: '',
    repo: '',
}
const definitionFileName = <code>captain-definition</code>

type DeploymentProps = AppDetailsTabProps & { settingsNeedRefresh?: boolean }

export default class Deployment extends ApiComponent<
    DeploymentProps,
    {
        historyExpanded: boolean
        manualExpanded: boolean
        manualMethod: ManualMethod
        cliExpanded: boolean
        gitDraft?: GitRepoDraft
        definitionPathDraft?: string
        buildLogRecreationId: string
        updatedVersions?: Pick<IAppDef, 'versions' | 'deployedVersion'>
        versionRefreshFailed: boolean
    }
> {
    constructor(props: DeploymentProps) {
        super(props)
        this.state = {
            historyExpanded: true,
            manualExpanded: !props.apiData.appDefinition.versions?.length,
            manualMethod: ManualMethod.Archive,
            cliExpanded: false,
            buildLogRecreationId: '',
            versionRefreshFailed: false,
        }
    }

    componentDidUpdate(previousProps: DeploymentProps) {
        const previous = previousProps.apiData.appDefinition
        const current = this.props.apiData.appDefinition
        if (
            (this.state.updatedVersions || this.state.versionRefreshFailed) &&
            (previous.deployedVersion !== current.deployedVersion ||
                !deepEqual(previous.versions, current.versions))
        ) {
            this.setState({
                updatedVersions: undefined,
                versionRefreshFailed: false,
            })
        }
    }

    onUploadSuccess() {
        if (this.willUnmountSoon) return
        message.info(localize('apps.deploy_build_started', 'Build has started'))
        this.setState({ buildLogRecreationId: `${new Date().getTime()}` })
        DomUtils.scrollToTopBar()
    }

    onAppBuildFinished() {
        const self = this
        self.apiManager
            .getAllApps()
            .then(function (data) {
                if (self.willUnmountSoon) return
                const app = data.appDefinitions?.find(
                    (definition) =>
                        definition.appName ===
                        self.props.apiData.appDefinition.appName
                )
                if (!app || !Array.isArray(app.versions)) {
                    throw new Error(
                        localize(
                            'apps.deploy_history_unavailable',
                            'Deployment details unavailable'
                        )
                    )
                }

                self.setState({
                    updatedVersions: {
                        deployedVersion: app.deployedVersion,
                        versions: app.versions,
                    },
                    versionRefreshFailed: false,
                })
            })
            .catch(function () {
                if (!self.willUnmountSoon)
                    self.setState({ versionRefreshFailed: true })
            })
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

    renderDeploymentHistory(
        versions: IAppVersion[] | undefined,
        deployedVersion: number
    ) {
        const active = versions?.find(
            (version) =>
                version.version === deployedVersion &&
                !!version.deployedImageName
        )
        const knownVersion =
            !!active ||
            (Number.isInteger(deployedVersion) && deployedVersion > 0)
        const noDeployment =
            deployedVersion === 0 &&
            !!versions &&
            (versions.length === 0 ||
                versions.some((version) => version.version === 0)) &&
            !active
        const gitHash = active?.gitHash?.trim()
        const { appName } = this.props.apiData.appDefinition
        const { historyExpanded } = this.state

        return (
            <Card
                size="small"
                className="deployment-history-card"
                title={
                    <Flex align="center" wrap gap="small">
                        <h3>
                            {localize(
                                'apps.deploy_history',
                                'Deployment history'
                            )}
                        </h3>
                        <Button
                            type="link"
                            size="small"
                            aria-expanded={historyExpanded}
                            aria-controls="deployment-history-table"
                            onClick={() =>
                                this.setState({
                                    historyExpanded: !historyExpanded,
                                })
                            }
                        >
                            {historyExpanded
                                ? localize(
                                      'apps.deploy_hide_history',
                                      'Hide history'
                                  )
                                : localize(
                                      'apps.deploy_view_history',
                                      'View history'
                                  )}
                        </Button>
                    </Flex>
                }
            >
                <Flex vertical gap="small">
                    <BuildLogsView
                        onAppBuildFinished={() => this.onAppBuildFinished()}
                        appName={appName!}
                        buildLogRecreationId={this.state.buildLogRecreationId}
                        key={`${appName}-${this.state.buildLogRecreationId}`}
                        summaryHeading={
                            <h4 className="deployment-active-heading">
                                {localize(
                                    'apps.deploy_active',
                                    'Active deployment'
                                )}
                            </h4>
                        }
                    >
                        <Flex vertical gap={4}>
                            {knownVersion && (
                                <Typography.Text strong>
                                    {localize('apps.deploy_version', 'Version')}{' '}
                                    {deployedVersion}
                                </Typography.Text>
                            )}
                            {active ? (
                                <Flex wrap gap="4px 12px">
                                    <Typography.Text>
                                        {localize(
                                            'apps.deploy_image_name',
                                            'Image Name'
                                        )}{' '}
                                        <Typography.Text code>
                                            {active.deployedImageName}
                                        </Typography.Text>
                                    </Typography.Text>
                                    {active.timeStamp && (
                                        <Typography.Text>
                                            {localize(
                                                'apps.deploy_time',
                                                'Deploy Time'
                                            )}{' '}
                                            <Timestamp
                                                timestamp={active.timeStamp}
                                            />
                                        </Typography.Text>
                                    )}
                                    {gitHash && (
                                        <Typography.Text>
                                            {localize(
                                                'apps.deploy_git_hash',
                                                'git hash'
                                            )}{' '}
                                            <Typography.Text code>
                                                {gitHash}
                                            </Typography.Text>
                                        </Typography.Text>
                                    )}
                                </Flex>
                            ) : (
                                <Typography.Text type="secondary">
                                    {noDeployment
                                        ? localize(
                                              'apps.deploy_no_active',
                                              'No active deployment yet'
                                          )
                                        : localize(
                                              'apps.deploy_history_unavailable',
                                              'Deployment details unavailable'
                                          )}
                                </Typography.Text>
                            )}
                        </Flex>
                    </BuildLogsView>
                    {this.state.versionRefreshFailed && (
                        <Alert
                            type="warning"
                            showIcon
                            message={localize(
                                'apps.deploy_refresh_failed',
                                'Could not refresh deployment details. The information shown may be out of date.'
                            )}
                            action={
                                <Button
                                    size="small"
                                    onClick={() => this.onAppBuildFinished()}
                                >
                                    {localize('apps.deploy_retry', 'Retry')}
                                </Button>
                            }
                        />
                    )}
                    <div
                        id="deployment-history-table"
                        hidden={!historyExpanded}
                    >
                        {historyExpanded &&
                            (versions ? (
                                <AppVersionTable
                                    onVersionRollbackRequested={(version) =>
                                        this.onVersionRollbackRequested(version)
                                    }
                                    versions={versions}
                                    deployedVersion={deployedVersion}
                                />
                            ) : (
                                <Typography.Text type="secondary">
                                    {localize(
                                        'apps.deploy_history_unavailable',
                                        'Deployment details unavailable'
                                    )}
                                </Typography.Text>
                            ))}
                    </div>
                </Flex>
            </Card>
        )
    }

    renderGitSettings() {
        const self = this
        const { appDefinition, captainSubDomain, rootDomain } =
            this.props.apiData
        const webhook = appDefinition.appPushWebhook
        const repoInfo = { ...EMPTY_REPO, ...webhook?.repoInfo }
        const { gitDraft } = this.state
        const savedDraft = createGitRepoDraft(repoInfo)
        const repoInfoForSave =
            gitDraft && getGitRepoInfoForSave(gitDraft, repoInfo)
        const gitDirty =
            !!repoInfoForSave &&
            !deepEqual(
                repoInfoForSave,
                getGitRepoInfoForSave(savedDraft, repoInfo),
                { strict: true }
            )
        const pushToken = webhook?.pushWebhookToken
        const webhookPath = `/user/apps/webhooks/triggerbuild?namespace=captain&token=${pushToken}`
        const gitLabel = localize(
            'apps.deploy_git_repository',
            'Git repository'
        )

        return (
            <section className="deployment-settings-row" aria-label={gitLabel}>
                <Flex vertical align="start" gap="small">
                    <div>
                        <Typography.Text strong>{gitLabel}</Typography.Text>
                        <div>
                            {repoInfo.repo ? (
                                <Typography.Text type="secondary">
                                    {repoInfo.repo}
                                    {repoInfo.branch && ` · ${repoInfo.branch}`}
                                </Typography.Text>
                            ) : (
                                <Typography.Text type="secondary">
                                    {localize(
                                        'apps.deploy_git_not_configured',
                                        'No repository configured'
                                    )}
                                </Typography.Text>
                            )}
                        </div>
                    </div>
                    <Flex wrap gap="small">
                        {repoInfo.repo && (
                            <Button
                                disabled={
                                    !pushToken ||
                                    gitDirty ||
                                    this.props.settingsNeedRefresh
                                }
                                onClick={() => {
                                    self.apiManager
                                        .forceBuild(webhookPath)
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
                        )}
                        <Button
                            aria-expanded={!!gitDraft}
                            onClick={() =>
                                this.setState({
                                    gitDraft: gitDraft ? undefined : savedDraft,
                                })
                            }
                        >
                            {gitDraft
                                ? localize('apps.deploy_cancel_edit', 'Cancel')
                                : localize('apps.generic_edit_button', 'Edit')}
                        </Button>
                    </Flex>
                </Flex>
                {gitDraft && (
                    <div className="deployment-settings-editor">
                        <p>
                            {localize(
                                'apps.deploy_method_github_description',
                                'Enter your repository information in the form and save. Then copy the URL in the box as a webhook on Github, Bitbucket, Gitlab and etc. Once you push a commit, CapRover starts a new build.'
                            )}
                        </p>
                        <Input
                            aria-label={localize(
                                'apps.deploy_webhook_url',
                                'Webhook URL'
                            )}
                            onFocus={(e) => {
                                if (pushToken) {
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
                            readOnly
                            disabled={!pushToken}
                            value={
                                pushToken
                                    ? `${window.location.protocol}//${captainSubDomain}.${rootDomain}/api/v2${webhookPath}`
                                    : localize(
                                          'apps.deploy_method_github_url_hint',
                                          'Add repo info and save for this webhook to appear'
                                      )
                            }
                            style={{ marginBottom: 16 }}
                        />
                        <GitRepoForm
                            gitRepoValues={gitDraft}
                            updateRepoInfo={(newRepo) =>
                                this.setState({ gitDraft: newRepo })
                            }
                        />
                        <Button
                            disabled={!gitDirty}
                            type="primary"
                            onClick={() => {
                                if (!repoInfoForSave) return
                                this.props
                                    .onUpdateConfigAndSave({
                                        appPushWebhook: {
                                            tokenVersion:
                                                webhook?.tokenVersion || '',
                                            pushWebhookToken: pushToken || '',
                                            repoInfo: repoInfoForSave,
                                        },
                                    })
                                    .then((saved) => {
                                        if (saved && !this.willUnmountSoon)
                                            this.setState({
                                                gitDraft: undefined,
                                            })
                                    })
                            }}
                        >
                            {localize('apps.edit_app_config', 'Save & Restart')}
                        </Button>
                    </div>
                )}
            </section>
        )
    }

    renderCliSettings() {
        const tokenConfig =
            this.props.apiData.appDefinition.appDeployTokenConfig
        const token = tokenConfig?.enabled
            ? tokenConfig.appDeployToken
            : undefined
        const cliLabel = localize('apps.deploy_cli_ci', 'CLI & CI')
        return (
            <section className="deployment-settings-row" aria-label={cliLabel}>
                <Flex vertical align="start" gap="small">
                    <div>
                        <Typography.Text strong>{cliLabel}</Typography.Text>
                        <div>
                            <Typography.Text type="secondary">
                                {tokenConfig?.enabled
                                    ? localize(
                                          'apps.deploy_app_token_enabled',
                                          'App token enabled'
                                      )
                                    : localize(
                                          'apps.deploy_app_token_disabled',
                                          'App token disabled'
                                      )}
                            </Typography.Text>
                        </div>
                    </div>
                    <Button
                        aria-expanded={this.state.cliExpanded}
                        onClick={() =>
                            this.setState(({ cliExpanded }) => ({
                                cliExpanded: !cliExpanded,
                            }))
                        }
                    >
                        {this.state.cliExpanded
                            ? localize(
                                  'apps.deploy_hide_token_settings',
                                  'Hide token settings'
                              )
                            : localize(
                                  'apps.deploy_manage_token',
                                  'Manage token'
                              )}
                    </Button>
                </Flex>
                {this.state.cliExpanded && (
                    <div className="deployment-settings-editor">
                        <p>
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
                            {Utils.formatText(
                                localize(
                                    'apps.deploy_cli_description_part2',
                                    "If you're using CI/CD to run %s and you do not wish to use your password, you can use app-specific tokens"
                                ),
                                ['%s'],
                                [<code>caprover deploy</code>]
                            )}{' '}
                            <NewTabLink url="https://caprover.com/docs/ci-cd-integration.html#app-tokens">
                                {localize('apps.link_see_here', '(here)')}
                            </NewTabLink>
                            .
                        </p>
                        <Flex wrap gap="small">
                            <Button
                                disabled={this.props.settingsNeedRefresh}
                                onClick={() =>
                                    this.props.onUpdateConfigAndSave({
                                        appDeployTokenConfig: {
                                            ...tokenConfig,
                                            enabled: !tokenConfig?.enabled,
                                        },
                                    })
                                }
                            >
                                {tokenConfig?.enabled
                                    ? localize(
                                          'apps.deploy_button_disable_app_token',
                                          'Disable App Token'
                                      )
                                    : localize(
                                          'apps.deploy_button_enable_app_token',
                                          'Enable App Token'
                                      )}
                            </Button>
                            <Input
                                aria-label={localize(
                                    'apps.deploy_app_token',
                                    'App token'
                                )}
                                onFocus={(e) => {
                                    if (token) {
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
                                readOnly
                                disabled={!token}
                                value={
                                    token ||
                                    localize(
                                        'apps.deploy_app_token_description',
                                        'Enable App Token to generate a random app token'
                                    )
                                }
                                style={{ flex: '1 1 260px' }}
                            />
                        </Flex>
                    </div>
                )}
            </section>
        )
    }

    renderDefinitionPath() {
        const savedPath =
            this.props.apiData.appDefinition
                .captainDefinitionRelativeFilePath || ''
        const { definitionPathDraft } = this.state
        const editing = definitionPathDraft !== undefined
        const pathLabel = localize(
            'apps.deploy_captain_definition_relative_path_hint',
            '%s path'
        )
        return (
            <section
                className="deployment-settings-row"
                aria-label={pathLabel.replace('%s', 'captain-definition')}
            >
                <Flex vertical align="start" gap="small">
                    <div>
                        <Typography.Text strong>
                            {Utils.formatText(
                                pathLabel,
                                ['%s'],
                                [definitionFileName]
                            )}
                        </Typography.Text>
                        <div>
                            <Typography.Text type="secondary" code>
                                {savedPath || './captain-definition'}
                            </Typography.Text>
                        </div>
                    </div>
                    <Button
                        aria-expanded={editing}
                        onClick={() =>
                            this.setState({
                                definitionPathDraft: editing
                                    ? undefined
                                    : savedPath,
                            })
                        }
                    >
                        {editing
                            ? localize('apps.deploy_cancel_edit', 'Cancel')
                            : localize('apps.generic_edit_button', 'Edit')}
                    </Button>
                </Flex>
                {editing && (
                    <div className="deployment-settings-editor">
                        <p>
                            {Utils.formatText(
                                localize(
                                    'apps.deploy_captain_definition_relative_path_hint_tooltip',
                                    'Edit only if you have placed your %s file in a subdirectory of your project'
                                ),
                                ['%s'],
                                [definitionFileName]
                            )}
                            {'. '}
                            {Utils.formatText(
                                localize(
                                    'apps.deploy_captain_definition_path_hint',
                                    "You shouldn't need to change this path unless you have a repository with multiple %s files (mono repos). Read docs for %s before editing this"
                                ),
                                ['%s', '%s'],
                                [definitionFileName, definitionFileName]
                            )}
                        </p>
                        <Flex wrap gap="small">
                            <Input
                                aria-label={pathLabel.replace(
                                    '%s',
                                    'captain-definition'
                                )}
                                value={definitionPathDraft}
                                placeholder="./captain-definition"
                                style={{ flex: '1 1 260px' }}
                                onChange={(e) =>
                                    this.setState({
                                        definitionPathDraft: e.target.value,
                                    })
                                }
                            />
                            <Button
                                type="primary"
                                disabled={definitionPathDraft === savedPath}
                                onClick={() => {
                                    this.props
                                        .onUpdateConfigAndSave({
                                            captainDefinitionRelativeFilePath:
                                                definitionPathDraft,
                                        })
                                        .then((saved) => {
                                            if (saved && !this.willUnmountSoon)
                                                this.setState({
                                                    definitionPathDraft:
                                                        undefined,
                                                })
                                        })
                                }}
                            >
                                {localize(
                                    'apps.edit_app_config',
                                    'Save & Restart'
                                )}
                            </Button>
                        </Flex>
                    </div>
                )}
            </section>
        )
    }

    renderManualDeployment() {
        const { manualExpanded, manualMethod } = this.state
        const uploaderProps = {
            appName: this.props.apiData.appDefinition.appName!,
            onUploadSucceeded: () => this.onUploadSuccess(),
        }
        return (
            <Card
                size="small"
                className={
                    manualExpanded ? undefined : 'deployment-card-collapsed'
                }
                styles={{ header: { padding: 0 } }}
                title={
                    <h3>
                        <Button
                            type="text"
                            className="deployment-manual-toggle"
                            aria-expanded={manualExpanded}
                            aria-controls="deployment-manual-options"
                            aria-labelledby="deployment-manual-title"
                            aria-describedby="deployment-manual-description"
                            onClick={() =>
                                this.setState({
                                    manualExpanded: !manualExpanded,
                                })
                            }
                        >
                            <span>
                                <Typography.Text
                                    strong
                                    id="deployment-manual-title"
                                    className="deployment-manual-title"
                                >
                                    {localize(
                                        'apps.deploy_new_version',
                                        'Deploy a new version'
                                    )}
                                    {manualExpanded ? (
                                        <UpOutlined aria-hidden="true" />
                                    ) : (
                                        <DownOutlined aria-hidden="true" />
                                    )}
                                </Typography.Text>
                                <Typography.Text
                                    type="secondary"
                                    id="deployment-manual-description"
                                >
                                    {localize(
                                        'apps.deploy_manual_description',
                                        'Upload a CapRover archive, use a Docker image, or build from a definition.'
                                    )}
                                </Typography.Text>
                            </span>
                        </Button>
                    </h3>
                }
            >
                <div id="deployment-manual-options" hidden={!manualExpanded}>
                    <Radio.Group
                        aria-label={localize(
                            'apps.deploy_method',
                            'Deployment method'
                        )}
                        value={manualMethod}
                        onChange={(event) =>
                            this.setState({ manualMethod: event.target.value })
                        }
                    >
                        <Flex wrap gap="small">
                            <Radio.Button value={ManualMethod.Archive}>
                                {localize(
                                    'apps.deploy_archive',
                                    'CapRover archive'
                                )}
                            </Radio.Button>
                            <Radio.Button value={ManualMethod.Image}>
                                {localize(
                                    'apps.deploy_docker_image',
                                    'Docker image'
                                )}
                            </Radio.Button>
                            <Radio.Button value={ManualMethod.Dockerfile}>
                                {localize(
                                    'apps.deploy_dockerfile',
                                    'Dockerfile'
                                )}
                            </Radio.Button>
                            <Radio.Button value={ManualMethod.Definition}>
                                {definitionFileName}
                            </Radio.Button>
                        </Flex>
                    </Radio.Group>
                    <div
                        className="deployment-settings-editor"
                        hidden={manualMethod !== ManualMethod.Archive}
                    >
                        <TarUploader {...uploaderProps} />
                    </div>
                    <div hidden={manualMethod !== ManualMethod.Image}>
                        <UploaderPlainTextImageName {...uploaderProps} />
                    </div>
                    <div hidden={manualMethod !== ManualMethod.Dockerfile}>
                        <UploaderPlainTextDockerfile {...uploaderProps} />
                    </div>
                    <div hidden={manualMethod !== ManualMethod.Definition}>
                        <UploaderPlainTextCaptainDefinition
                            {...uploaderProps}
                        />
                    </div>
                </div>
            </Card>
        )
    }

    render() {
        const app = this.props.apiData.appDefinition
        const { gitDraft, cliExpanded, definitionPathDraft } = this.state
        const settingsExpanded =
            !!gitDraft || cliExpanded || definitionPathDraft !== undefined
        const snapshot = this.state.updatedVersions || app
        const versions = Array.isArray(snapshot.versions)
            ? snapshot.versions
            : undefined

        return (
            <div className="deployment-tab">
                {this.renderDeploymentHistory(
                    versions,
                    snapshot.deployedVersion
                )}
                <Card
                    size="small"
                    className="deployment-settings-card"
                    title={
                        <h3>
                            {localize(
                                'apps.deploy_settings',
                                'Deployment settings'
                            )}
                        </h3>
                    }
                >
                    {this.props.settingsNeedRefresh && (
                        <Alert
                            type="warning"
                            showIcon
                            message={localize(
                                'apps.deploy_settings_refresh_failed',
                                'Settings were saved, but the displayed values may be out of date.'
                            )}
                            action={
                                <Button
                                    size="small"
                                    onClick={() => this.props.reFetchData()}
                                >
                                    {localize('apps.deploy_retry', 'Retry')}
                                </Button>
                            }
                        />
                    )}
                    <div
                        className={
                            settingsExpanded
                                ? undefined
                                : 'deployment-settings-grid'
                        }
                    >
                        {this.renderGitSettings()}
                        {this.renderCliSettings()}
                        {this.renderDefinitionPath()}
                    </div>
                </Card>
                {this.renderManualDeployment()}
                <NewTabLink url="https://caprover.com/docs/deployment-methods.html">
                    {localize('apps.deploy_methods_docs', 'Deployment methods')}
                </NewTabLink>
            </div>
        )
    }
}
