import {
    Alert,
    Badge,
    Button,
    Drawer,
    List,
    Space,
    Tag,
    Tooltip,
    Typography,
} from 'antd'
import { CapRoverModels } from 'caprover-api'
import moment from 'moment'
import { Component } from 'react'
import { Link } from 'react-router-dom'
import { localize } from '../../utils/Language'
import Utils from '../../utils/Utils'

interface AppRuntimeStatusProps {
    appName: string
    runtime: CapRoverModels.AppRuntime | undefined
    isLoading: boolean
    refreshFailed: boolean
    appDetailsPath?: string
    isMobile: boolean
}

interface AppRuntimeStatusState {
    isDrawerOpen: boolean
}

function getStatusBadge(
    runtime: CapRoverModels.AppRuntime | undefined
): 'success' | 'error' | 'default' {
    if (runtime?.status === CapRoverModels.AppRuntimeStatus.Running) {
        return 'success'
    }
    if (runtime?.status === CapRoverModels.AppRuntimeStatus.Degraded) {
        return 'error'
    }
    return 'default'
}

function getRuntimeSummary(
    runtime: CapRoverModels.AppRuntime | undefined
): string {
    if (
        !runtime ||
        runtime.runningInstances === null ||
        runtime.desiredInstances === null
    ) {
        return localize(
            'app_runtime.status_unavailable',
            'Runtime status unavailable'
        )
    }

    return `${runtime.runningInstances}/${runtime.desiredInstances} ${localize(
        'app_runtime.running',
        'running'
    )}`
}

function getStatusLabel(
    runtime: CapRoverModels.AppRuntime | undefined
): string {
    if (runtime?.status === CapRoverModels.AppRuntimeStatus.Running) {
        return localize('app_runtime.healthy', 'Healthy')
    }
    if (runtime?.status === CapRoverModels.AppRuntimeStatus.Degraded) {
        return localize('app_runtime.needs_attention', 'Needs attention')
    }
    if (runtime?.status === CapRoverModels.AppRuntimeStatus.Stopped) {
        return localize('app_runtime.stopped', 'Stopped')
    }
    return localize(
        'app_runtime.status_unavailable',
        'Runtime status unavailable'
    )
}

function getTaskStateLabel(task: CapRoverModels.RuntimeTask): string {
    return `${task.state.charAt(0).toUpperCase()}${task.state.slice(1)}`
}

function getStateDuration(task: CapRoverModels.RuntimeTask): string {
    if (!task.stateChangedAt) {
        return localize(
            'app_runtime.duration_unavailable',
            'Duration unavailable'
        )
    }

    const duration = moment(task.stateChangedAt).fromNow(true)
    if (task.state === CapRoverModels.TaskState.Running) {
        return `${localize(
            'app_runtime.running_for',
            'Running for'
        )} ${duration}`
    }

    return `${getTaskStateLabel(task)} ${duration} ${localize(
        'app_runtime.ago',
        'ago'
    )}`
}

function getTaskTagColor(task: CapRoverModels.RuntimeTask): string {
    if (task.state === CapRoverModels.TaskState.Running) return 'success'
    if (
        task.state === CapRoverModels.TaskState.Failed ||
        task.state === CapRoverModels.TaskState.Rejected ||
        task.state === CapRoverModels.TaskState.Orphaned
    ) {
        return 'error'
    }
    if (
        task.state === CapRoverModels.TaskState.Starting ||
        task.state === CapRoverModels.TaskState.Preparing ||
        task.state === CapRoverModels.TaskState.Ready ||
        task.state === CapRoverModels.TaskState.Pending
    ) {
        return 'processing'
    }
    return 'default'
}

function getNewestRunningTask(
    tasks: CapRoverModels.RuntimeTask[]
): CapRoverModels.RuntimeTask | undefined {
    return tasks
        .filter((task) => task.state === CapRoverModels.TaskState.Running)
        .sort((first, second) => {
            return (
                Date.parse(second.stateChangedAt || '') -
                Date.parse(first.stateChangedAt || '')
            )
        })[0]
}

function getTooltipDetail(
    runtime: CapRoverModels.AppRuntime | undefined
): string | undefined {
    if (!runtime) return undefined
    if (runtime.status === CapRoverModels.AppRuntimeStatus.Stopped) {
        return localize('app_runtime.stopped', 'Stopped')
    }
    if (runtime.status === CapRoverModels.AppRuntimeStatus.Unavailable) {
        return runtime.error || undefined
    }

    const currentTasks = runtime.currentTasks || []
    const newestRunningTask = getNewestRunningTask(currentTasks)
    if (runtime.status === CapRoverModels.AppRuntimeStatus.Running) {
        return newestRunningTask
            ? getStateDuration(newestRunningTask)
            : undefined
    }

    if (runtime.latestFailure?.occurredAt) {
        return `${localize('app_runtime.failed', 'Failed')} ${moment(
            runtime.latestFailure.occurredAt
        ).fromNow(true)} ${localize('app_runtime.ago', 'ago')}`
    }

    const nonRunningTask = currentTasks.find(
        (task) => task.state !== CapRoverModels.TaskState.Running
    )
    return nonRunningTask
        ? getStateDuration(nonRunningTask)
        : localize('app_runtime.needs_attention', 'Needs attention')
}

function getTaskTitle(task: CapRoverModels.RuntimeTask): string {
    return task.slot === null
        ? localize('app_runtime.task', 'Task')
        : `${localize('app_runtime.instance', 'Instance')} ${task.slot}`
}

function renderTask(
    task: CapRoverModels.RuntimeTask,
    showDiagnostics: boolean
) {
    return (
        <List.Item key={task.taskId}>
            <List.Item.Meta
                title={
                    <Space>
                        <span>{getTaskTitle(task)}</span>
                        <Tag color={getTaskTagColor(task)}>
                            {getTaskStateLabel(task)}
                        </Tag>
                    </Space>
                }
                description={
                    <Space direction="vertical" size={2}>
                        <span>
                            {getStateDuration(task)}
                            {task.nodeName ? ` · ${task.nodeName}` : ''}
                        </span>
                        {!!task.error && (
                            <Typography.Text type="danger">
                                {task.error}
                                {task.exitCode === null
                                    ? ''
                                    : ` (${localize(
                                          'app_runtime.exit_code',
                                          'exit code'
                                      )} ${task.exitCode})`}
                            </Typography.Text>
                        )}
                        {showDiagnostics && (
                            <Typography.Text type="secondary" copyable>
                                {task.taskId}
                            </Typography.Text>
                        )}
                        {showDiagnostics && !!task.image && (
                            <Typography.Text type="secondary">
                                {task.image}
                            </Typography.Text>
                        )}
                    </Space>
                }
            />
        </List.Item>
    )
}

export default class AppRuntimeStatus extends Component<
    AppRuntimeStatusProps,
    AppRuntimeStatusState
> {
    constructor(props: AppRuntimeStatusProps) {
        super(props)
        this.state = { isDrawerOpen: false }
    }

    renderTooltip() {
        const runtime = this.props.runtime
        const detail = getTooltipDetail(runtime)

        return (
            <Space direction="vertical" size={0}>
                <strong>{getRuntimeSummary(runtime)}</strong>
                {!!detail && <span>{detail}</span>}
                {this.props.refreshFailed && (
                    <span>
                        {localize(
                            'app_runtime.refresh_failed_short',
                            'Refresh failed; this status may be outdated'
                        )}
                    </span>
                )}
            </Space>
        )
    }

    renderDrawer() {
        const runtime = this.props.runtime
        const currentTasks = runtime?.currentTasks || []
        const taskHistory =
            runtime && 'taskHistory' in runtime
                ? (runtime as CapRoverModels.AppRuntimeDetails).taskHistory
                : undefined

        return (
            <Drawer
                title={
                    <Space>
                        <Badge status={getStatusBadge(runtime)} />
                        <span>{this.props.appName}</span>
                    </Space>
                }
                open={this.state.isDrawerOpen}
                onClose={() => this.setState({ isDrawerOpen: false })}
                width={this.props.isMobile ? '100%' : 440}
            >
                {this.props.refreshFailed && (
                    <Alert
                        showIcon
                        type="warning"
                        message={localize(
                            'app_runtime.refresh_failed',
                            'Could not refresh runtime status. These values may be outdated.'
                        )}
                        style={{ marginBottom: 20 }}
                    />
                )}

                <Typography.Title level={4}>
                    {getRuntimeSummary(runtime)}
                </Typography.Title>

                {!runtime ||
                runtime.status ===
                    CapRoverModels.AppRuntimeStatus.Unavailable ? (
                    <Alert
                        showIcon
                        type="warning"
                        message={localize(
                            'app_runtime.status_unavailable',
                            'Runtime status unavailable'
                        )}
                        description={runtime?.error}
                    />
                ) : (
                    <>
                        {runtime.status ===
                            CapRoverModels.AppRuntimeStatus.Degraded && (
                            <Alert
                                showIcon
                                type="error"
                                message={localize(
                                    'app_runtime.needs_attention',
                                    'Needs attention'
                                )}
                                description={localize(
                                    'app_runtime.instance_mismatch',
                                    'Fewer instances are running than expected.'
                                )}
                                style={{ marginBottom: 20 }}
                            />
                        )}

                        <Typography.Title level={5}>
                            {localize(
                                'app_runtime.current_tasks',
                                'Current tasks'
                            )}
                        </Typography.Title>
                        {currentTasks.length ? (
                            <List
                                size="small"
                                dataSource={currentTasks}
                                renderItem={(task) => renderTask(task, true)}
                            />
                        ) : (
                            <Typography.Text type="secondary">
                                {localize(
                                    'app_runtime.no_current_tasks',
                                    'No current tasks'
                                )}
                            </Typography.Text>
                        )}

                        {!!runtime.latestFailure && (
                            <>
                                <Typography.Title level={5}>
                                    {localize(
                                        'app_runtime.latest_failure',
                                        'Latest failure'
                                    )}
                                </Typography.Title>
                                <Alert
                                    showIcon
                                    type="error"
                                    message={
                                        runtime.latestFailure.occurredAt
                                            ? Utils.getRelativeDateTime(
                                                  runtime.latestFailure
                                                      .occurredAt
                                              )
                                            : localize(
                                                  'app_runtime.failure_time_unknown',
                                                  'Failure time unavailable'
                                              )
                                    }
                                    description={runtime.latestFailure.error}
                                />
                            </>
                        )}

                        {!!taskHistory && (
                            <>
                                <Typography.Title level={5}>
                                    {localize(
                                        'app_runtime.recent_history',
                                        'Recent task history'
                                    )}
                                </Typography.Title>
                                {taskHistory.length ? (
                                    <List
                                        size="small"
                                        dataSource={taskHistory}
                                        renderItem={(task) =>
                                            renderTask(task, false)
                                        }
                                    />
                                ) : (
                                    <Typography.Text type="secondary">
                                        {localize(
                                            'app_runtime.no_history',
                                            'No recent task history'
                                        )}
                                    </Typography.Text>
                                )}
                            </>
                        )}
                    </>
                )}

                {!!this.props.appDetailsPath && (
                    <div style={{ marginTop: 24 }}>
                        <Link to={this.props.appDetailsPath}>
                            <Button type="primary" block>
                                {localize(
                                    'app_runtime.open_app_details',
                                    'Open app details'
                                )}
                            </Button>
                        </Link>
                    </div>
                )}
            </Drawer>
        )
    }

    render() {
        if (this.props.isLoading && !this.props.runtime) return <></>

        const runtime = this.props.runtime
        const statusLabel = getStatusLabel(runtime)
        const runtimeSummary = getRuntimeSummary(runtime)
        const accessibleStatus = `${this.props.appName}, ${statusLabel}${
            statusLabel === runtimeSummary ? '' : `, ${runtimeSummary}`
        }`

        return (
            <>
                <Tooltip title={this.renderTooltip()}>
                    <Button
                        type="text"
                        shape="circle"
                        size={this.props.isMobile ? 'large' : 'small'}
                        aria-label={accessibleStatus}
                        onClick={() => this.setState({ isDrawerOpen: true })}
                    >
                        <Badge status={getStatusBadge(runtime)} />
                    </Button>
                </Tooltip>
                {this.renderDrawer()}
            </>
        )
    }
}
