import { Alert, Button, Card, List, Space, Tag, Typography } from 'antd'
import { CapRoverModels } from 'caprover-api'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { Link } from 'react-router-dom'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import ReduxState from '../../models/ReduxState'
import { refreshDiskUsage } from '../../redux/actions/DiskUsageActions'
import { localize } from '../../utils/Language'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import Timestamp from '../global/Timestamp'
import AppRuntimeStatus, { RuntimeDataStatus } from '../apps/AppRuntimeStatus'
import DiskUsage from '../monitoring/DiskUsage'

interface OverviewProps extends RouteComponentProps<any> {
    diskUsage: DiskUsageViewState
    refreshDiskUsage: () => void
    isMobile: boolean
}

interface OverviewData {
    apps: CapRoverModels.IAppDef[] | undefined
    runtime: CapRoverModels.AppRuntime[] | undefined
    nodes: CapRoverModels.ServerDockerInfo[] | undefined
    version: CapRoverModels.IVersionInfo | undefined
    needsSetup: boolean | undefined
}

export function getRecentDeployments(apps: CapRoverModels.IAppDef[]) {
    const deployments: {
        appName: string
        version: CapRoverModels.IAppVersion
        isBuilding: boolean
        isCurrent: boolean
    }[] = []
    apps.forEach((app) => {
        if (!app.appName) return
        const versions = app.versions || []
        versions.forEach((version, index, versions) => {
            if (!Number.isFinite(Date.parse(version.timeStamp))) return
            deployments.push({
                appName: app.appName!,
                version,
                isBuilding:
                    !!app.isAppBuilding && index === versions.length - 1,
                isCurrent: app.deployedVersion === version.version,
            })
        })
    })
    return deployments
        .sort(
            (a, b) =>
                Date.parse(b.version.timeStamp) -
                Date.parse(a.version.timeStamp)
        )
        .slice(0, 5)
}

export class Overview extends ApiComponent<
    OverviewProps,
    { apiData: OverviewData | undefined }
> {
    constructor(props: OverviewProps) {
        super(props)
        this.state = { apiData: undefined }
    }

    componentDidMount() {
        this.reFetchData()
    }

    reFetchData() {
        const self = this
        self.setState({ apiData: undefined })
        self.props.refreshDiskUsage()
        return Promise.all([
            self.apiManager.getAllApps().catch(() => undefined),
            self.apiManager.getAppsRuntime().catch(() => undefined),
            self.apiManager.getAllNodes().catch(() => undefined),
            self.apiManager.getVersionInfo().catch(() => undefined),
            self.apiManager.getCaptainInfo().catch(() => undefined),
        ]).then(function (results) {
            if (self.willUnmountSoon) return
            self.setState({
                apiData: {
                    apps: results[0]?.appDefinitions,
                    runtime: results[1]?.apps,
                    nodes: results[2]?.nodes,
                    version: results[3],
                    needsSetup:
                        typeof results[4]?.forceSsl === 'boolean'
                            ? !results[4].forceSsl
                            : undefined,
                },
            })
        })
    }

    render() {
        const self = this
        const apiData = self.state.apiData
        if (!apiData) return <CenteredSpinner />

        const apps = apiData.apps
        const runtimes = (apps || []).map((app) =>
            apiData.runtime?.find((runtime) => runtime.appName === app.appName)
        )
        const knownRuntimes = runtimes.filter(
            (runtime): runtime is CapRoverModels.AppRuntime =>
                !!runtime &&
                !runtime.error &&
                runtime.status !==
                    CapRoverModels.AppRuntimeStatus.Unavailable &&
                typeof runtime.runningInstances === 'number' &&
                typeof runtime.desiredInstances === 'number'
        )
        const missingRuntimes = runtimes.length - knownRuntimes.length
        const running = knownRuntimes.reduce(
            (sum, runtime) => sum + runtime.runningInstances!,
            0
        )
        const desired = knownRuntimes.reduce(
            (sum, runtime) => sum + runtime.desiredInstances!,
            0
        )
        const attentionApps = (apps || []).filter(
            (app, index) =>
                runtimes[index]?.status !==
                    CapRoverModels.AppRuntimeStatus.Running ||
                !!runtimes[index]?.latestFailure ||
                !!runtimes[index]?.error
        )
        const recentDeployments = getRecentDeployments(apps || [])
        const unavailable = localize('overview.unavailable', 'Unavailable')

        return (
            <div className="server-overview-page">
                <div className="page-heading">
                    <h1>{localize('menu_item.overview', 'Overview')}</h1>
                    <p>
                        {localize(
                            'overview.subtitle',
                            'Operational status and recent deployments.'
                        )}
                    </p>
                </div>
                <Space wrap style={{ marginBottom: 24 }}>
                    <Button
                        type="primary"
                        onClick={() =>
                            self.props.history.push('/apps?create=true')
                        }
                    >
                        {localize('create_new_app.create_app', 'Create App')}
                    </Button>
                    <Link to="/apps">{localize('menu_item.app', 'Apps')}</Link>
                    <Link to="/monitoring">
                        {localize('menu_item.monitoring', 'Monitoring')}
                    </Link>
                    {apiData.version?.canUpdate && (
                        <Link to="/maintenance">
                            {localize('menu_item.maintenance', 'Maintenance')}
                        </Link>
                    )}
                    <Button onClick={() => self.reFetchData()}>
                        {localize('overview.refresh', 'Refresh')}
                    </Button>
                </Space>
                {apiData.needsSetup && (
                    <Alert
                        showIcon
                        type="info"
                        style={{ marginBottom: 24 }}
                        message={localize(
                            'overview.setup_incomplete',
                            'Initial setup is incomplete.'
                        )}
                        action={
                            <Link to="/dashboard">
                                {localize(
                                    'overview.continue_setup',
                                    'Continue Setup'
                                )}
                            </Link>
                        }
                    />
                )}
                <div className="server-overview-grid">
                    <Card title={localize('overview.app_health', 'App Health')}>
                        {!apps ? (
                            <Alert
                                type="warning"
                                showIcon
                                message={localize(
                                    'overview.apps_unavailable',
                                    'App data is unavailable. Refresh to try again.'
                                )}
                            />
                        ) : apps.length === 0 ? (
                            <p>
                                {localize(
                                    'overview.no_apps',
                                    'No apps yet. Create your first app to get started.'
                                )}
                            </p>
                        ) : (
                            <>
                                <div className="overview-value">
                                    {knownRuntimes.length
                                        ? `${running}/${desired}`
                                        : unavailable}
                                </div>
                                <p>
                                    {localize(
                                        'overview.running_desired',
                                        'Running / desired instances with available runtime data'
                                    )}
                                </p>
                                <p>
                                    {apps.length}{' '}
                                    {localize('overview.apps', 'apps')}
                                    {missingRuntimes > 0 &&
                                        ` · ${missingRuntimes} ${localize('overview.runtime_missing', 'with unavailable runtime data')}`}
                                </p>
                                {attentionApps.length > 0 && (
                                    <List
                                        size="small"
                                        dataSource={attentionApps.slice(0, 5)}
                                        renderItem={(app) => {
                                            const runtime =
                                                apiData.runtime?.find(
                                                    (it) =>
                                                        it.appName ===
                                                        app.appName
                                                )
                                            return (
                                                <List.Item>
                                                    <Space
                                                        direction="vertical"
                                                        style={{
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <Space wrap>
                                                            <Link
                                                                to={`/apps/details/${encodeURIComponent(app.appName!)}`}
                                                            >
                                                                {app.appName}
                                                            </Link>
                                                            <AppRuntimeStatus
                                                                appName={
                                                                    app.appName!
                                                                }
                                                                runtime={
                                                                    runtime
                                                                }
                                                                runtimeDataStatus={
                                                                    apiData.runtime
                                                                        ? RuntimeDataStatus.Ready
                                                                        : RuntimeDataStatus.Failed
                                                                }
                                                                isMobile={
                                                                    self.props
                                                                        .isMobile
                                                                }
                                                                showInstances
                                                            />
                                                        </Space>
                                                        {runtime?.latestFailure && (
                                                            <Typography.Text type="secondary">
                                                                {localize(
                                                                    'overview.previous_task_failure',
                                                                    'Previous task failure'
                                                                )}
                                                                :{' '}
                                                                {
                                                                    runtime
                                                                        .latestFailure
                                                                        .error
                                                                }
                                                            </Typography.Text>
                                                        )}
                                                    </Space>
                                                </List.Item>
                                            )
                                        }}
                                    />
                                )}
                                {attentionApps.length > 5 && (
                                    <Link to="/apps">
                                        {localize(
                                            'overview.view_all_apps',
                                            'View all apps'
                                        )}
                                    </Link>
                                )}
                            </>
                        )}
                    </Card>
                    <Card
                        title={localize(
                            'menu_item.infrastructure',
                            'Infrastructure'
                        )}
                    >
                        {!apiData.nodes ? (
                            <Alert
                                type="warning"
                                showIcon
                                message={localize(
                                    'overview.nodes_unavailable',
                                    'Node data is unavailable. Refresh to try again.'
                                )}
                            />
                        ) : (
                            <>
                                <div className="overview-value">
                                    {apiData.nodes.length}
                                </div>
                                <p>{localize('overview.nodes', 'nodes')}</p>
                                <Space direction="vertical">
                                    {apiData.nodes.map((node) => (
                                        <div key={node.nodeId}>
                                            <strong>
                                                {node.hostname || node.nodeId}
                                            </strong>{' '}
                                            <Tag
                                                color={
                                                    node.state === 'ready' &&
                                                    node.status === 'active'
                                                        ? 'success'
                                                        : 'warning'
                                                }
                                            >
                                                {localize(
                                                    `overview.node_state.${node.state}`,
                                                    node.state || unavailable
                                                )}{' '}
                                                /{' '}
                                                {localize(
                                                    `overview.node_availability.${node.status}`,
                                                    node.status || unavailable
                                                )}
                                            </Tag>
                                        </div>
                                    ))}
                                </Space>
                                <div style={{ marginTop: 16 }}>
                                    <Link to="/cluster">
                                        {localize(
                                            'overview.manage_infrastructure',
                                            'Manage infrastructure'
                                        )}
                                    </Link>
                                </div>
                            </>
                        )}
                    </Card>
                    <DiskUsage
                        diskUsage={self.props.diskUsage}
                        history={self.props.history}
                        refreshDiskUsage={self.props.refreshDiskUsage}
                        compact
                    />
                    <Card title="CapRover">
                        {!apiData.version ? (
                            <Alert
                                type="warning"
                                showIcon
                                message={localize(
                                    'overview.version_unavailable',
                                    'Version information is unavailable. Refresh to try again.'
                                )}
                            />
                        ) : (
                            <>
                                <div className="overview-value">
                                    {apiData.version.currentVersion ||
                                        unavailable}
                                </div>
                                <p>
                                    {localize(
                                        'overview.installed_version',
                                        'Installed version'
                                    )}
                                </p>
                                {apiData.version.canUpdate ? (
                                    <Alert
                                        showIcon
                                        type="info"
                                        message={`${localize('overview.update_available', 'Update available')}: ${apiData.version.latestVersion || unavailable}`}
                                        action={
                                            <Link to="/maintenance">
                                                {localize(
                                                    'overview.review_update',
                                                    'Review update'
                                                )}
                                            </Link>
                                        }
                                    />
                                ) : apiData.version.canUpdate === false ? (
                                    <p>
                                        {localize(
                                            'overview.no_update',
                                            'No update is available.'
                                        )}
                                    </p>
                                ) : (
                                    <p>
                                        {localize(
                                            'overview.update_status_unavailable',
                                            'Update status is unavailable.'
                                        )}
                                    </p>
                                )}
                            </>
                        )}
                    </Card>
                </div>
                <Card
                    title={localize(
                        'overview.recent_deployments',
                        'Recent Deployments'
                    )}
                >
                    {!apps ? (
                        <Alert
                            type="warning"
                            showIcon
                            message={localize(
                                'overview.deployments_unavailable',
                                'Deployment history is unavailable. Refresh to try again.'
                            )}
                        />
                    ) : recentDeployments.length === 0 ? (
                        <p>
                            {localize(
                                'overview.no_deployments',
                                'No deployment history is available yet.'
                            )}
                        </p>
                    ) : (
                        <List
                            dataSource={recentDeployments}
                            renderItem={(deployment) => (
                                <List.Item
                                    key={`${deployment.appName}-${deployment.version.version}`}
                                >
                                    <Space wrap>
                                        <Link
                                            to={`/apps/details/${encodeURIComponent(deployment.appName)}`}
                                        >
                                            {deployment.appName}
                                        </Link>
                                        <span>
                                            {localize(
                                                'apps.deploy_version',
                                                'Version'
                                            )}{' '}
                                            {deployment.version.version}
                                        </span>
                                        <Tag
                                            color={
                                                deployment.isCurrent
                                                    ? 'success'
                                                    : deployment.version
                                                            .deployedImageName
                                                      ? 'default'
                                                      : deployment.isBuilding
                                                        ? 'processing'
                                                        : 'error'
                                            }
                                        >
                                            {deployment.isCurrent
                                                ? localize(
                                                      'apps.deploy_current_version_tooltip',
                                                      'Current Version'
                                                  )
                                                : deployment.version
                                                        .deployedImageName
                                                  ? localize(
                                                        'overview.image_available',
                                                        'Image available'
                                                    )
                                                  : deployment.isBuilding
                                                    ? localize(
                                                          'overview.build_in_progress',
                                                          'Build in progress'
                                                      )
                                                    : localize(
                                                          'apps.deploy_failed_deploy_tooltip',
                                                          'Failed deploy'
                                                      )}
                                        </Tag>
                                        <Timestamp
                                            timestamp={
                                                deployment.version.timeStamp
                                            }
                                            relative
                                        />
                                    </Space>
                                </List.Item>
                            )}
                        />
                    )}
                </Card>
            </div>
        )
    }
}

function mapStateToProps(state: ReduxState) {
    return {
        diskUsage: state.globalReducer.diskUsage,
        isMobile: !!state.globalReducer.isMobile,
    }
}

export default connect(mapStateToProps, { refreshDiskUsage })(Overview)
