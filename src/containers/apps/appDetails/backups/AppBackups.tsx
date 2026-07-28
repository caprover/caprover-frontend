import {
    CloudUploadOutlined,
    DeleteOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import {
    Button,
    Card,
    Col,
    Collapse,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Switch,
    Table,
    Tag,
    Tooltip,
    message,
} from 'antd'
import { Component } from 'react'
import { localize } from '../../../../utils/Language'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import { AppDetailsTabProps } from '../AppDetails'
import {
    IAppBackupConfig,
    IBackupJobRecord,
    IBackupSource,
    IRcloneRemoteMasked,
    IRcloneRemoteType,
} from './BackupModels'
import RcloneRemoteForm from './RcloneRemoteForm'

const SCHEDULE_PRESETS: { label: string; value: string }[] = [
    { label: 'Manual only', value: '' },
    { label: 'Daily (03:00)', value: '0 3 * * *' },
    { label: 'Weekly (Sunday 03:00)', value: '0 3 * * 0' },
    { label: 'Custom', value: 'custom' },
]

function defaultConfig(): IAppBackupConfig {
    return {
        enabled: false,
        remoteId: '',
        remotePath: '',
        sources: [],
        cronSchedule: '',
        retentionDays: 0,
    }
}

interface AppBackupsState {
    isLoading: boolean
    remotes: IRcloneRemoteMasked[]
    config: IAppBackupConfig
    jobs: IBackupJobRecord[]
    remoteFormVisible: boolean
    schedulePreset: string
    logModal: { visible: boolean; title: string; content: string }
}

export default class AppBackups extends Component<
    AppDetailsTabProps,
    AppBackupsState
> {
    constructor(props: AppDetailsTabProps) {
        super(props)
        this.state = {
            isLoading: true,
            remotes: [],
            config: defaultConfig(),
            jobs: [],
            remoteFormVisible: false,
            schedulePreset: '',
            logModal: { visible: false, title: '', content: '' },
        }
    }

    componentDidMount() {
        this.refreshAll()
    }

    get appName(): string {
        return this.props.apiData.appDefinition.appName || ''
    }

    get apiManager() {
        return this.props.apiManager
    }

    refreshAll() {
        const self = this
        self.setState({ isLoading: true })
        return Promise.all([
            self.apiManager.getBackupRemotes(),
            self.apiManager.getAppBackupConfig(self.appName),
            self.apiManager.getAppBackupJobs(self.appName),
        ])
            .then(function ([remotesRes, configRes, jobsRes]: any[]) {
                const config: IAppBackupConfig =
                    (configRes && configRes.config) || defaultConfig()
                const preset = SCHEDULE_PRESETS.some(
                    (p) => p.value === (config.cronSchedule || '')
                )
                    ? config.cronSchedule || ''
                    : 'custom'
                self.setState({
                    isLoading: false,
                    remotes: (remotesRes && remotesRes.remotes) || [],
                    config,
                    jobs: (jobsRes && jobsRes.jobs) || [],
                    schedulePreset: preset,
                })
            })
            .catch(
                Toaster.createCatcher(function () {
                    self.setState({ isLoading: false })
                })
            )
    }

    updateConfig(patch: Partial<IAppBackupConfig>) {
        this.setState((prev) => ({ config: { ...prev.config, ...patch } }))
    }

    getSource(volumeName: string): IBackupSource | undefined {
        return this.state.config.sources.find(
            (s) => s.volumeName === volumeName
        )
    }

    toggleSource(volumeName: string, included: boolean) {
        const others = this.state.config.sources.filter(
            (s) => s.volumeName !== volumeName
        )
        const sources = included
            ? [...others, { volumeName, path: '' }]
            : others
        this.updateConfig({ sources })
    }

    setSourcePath(volumeName: string, path: string) {
        const sources = this.state.config.sources.map((s) =>
            s.volumeName === volumeName ? { ...s, path } : s
        )
        this.updateConfig({ sources })
    }

    renderVolumeRow(volumeName: string, containerPath: string) {
        const self = this
        const source = this.getSource(volumeName)
        const included = !!source
        return (
            <Row
                key={volumeName}
                gutter={8}
                align="middle"
                style={{ marginBottom: 8 }}
            >
                <Col>
                    <Switch
                        size="small"
                        checked={included}
                        onChange={(checked) =>
                            self.toggleSource(volumeName, checked)
                        }
                    />
                </Col>
                <Col flex="220px">
                    <strong>{volumeName}</strong>
                    <div style={{ opacity: 0.6, fontSize: 12 }}>
                        {containerPath}
                    </div>
                </Col>
                <Col flex="auto">
                    <Input
                        addonBefore={localize(
                            'apps.backups_subpath',
                            'Subfolder'
                        )}
                        placeholder={localize(
                            'apps.backups_subpath_ph',
                            'whole volume (e.g. leave empty, or "backup")'
                        )}
                        disabled={!included}
                        value={source?.path || ''}
                        onChange={(e) =>
                            self.setSourcePath(volumeName, e.target.value)
                        }
                    />
                </Col>
            </Row>
        )
    }

    renderHookField(
        key:
            | 'preBackupCommand'
            | 'postBackupCommand'
            | 'preRestoreCommand'
            | 'postRestoreCommand',
        label: string,
        placeholder?: string
    ) {
        const self = this
        return (
            <div style={{ marginBottom: 12 }}>
                <div>{label}</div>
                <Input.TextArea
                    rows={2}
                    placeholder={placeholder}
                    value={this.state.config[key] || ''}
                    onChange={(e) =>
                        self.updateConfig({ [key]: e.target.value })
                    }
                />
            </div>
        )
    }

    saveConfig() {
        const self = this
        self.setState({ isLoading: true })
        self.apiManager
            .setAppBackupConfig(self.appName, self.state.config)
            .then(function () {
                message.success(
                    localize('apps.backups_saved', 'Backup settings saved')
                )
                return self.refreshAll()
            })
            .catch(
                Toaster.createCatcher(function () {
                    self.setState({ isLoading: false })
                })
            )
    }

    runBackupNow() {
        const self = this
        self.apiManager
            .startAppBackup(self.appName)
            .then(function () {
                message.info(localize('apps.backups_started', 'Backup started'))
                return Utils.getDelayedPromise(1500).then(() =>
                    self.refreshAll()
                )
            })
            .catch(Toaster.createCatcher())
    }

    runRestoreNow() {
        const self = this
        self.apiManager
            .startAppRestore(self.appName)
            .then(function () {
                message.info(
                    localize('apps.backups_restore_started', 'Restore started')
                )
                return Utils.getDelayedPromise(1500).then(() =>
                    self.refreshAll()
                )
            })
            .catch(Toaster.createCatcher())
    }

    createRemote(
        name: string,
        type: IRcloneRemoteType,
        params: { [k: string]: string }
    ) {
        const self = this
        self.setState({ remoteFormVisible: false })
        self.apiManager
            .createBackupRemote(name, type, params)
            .then(function () {
                message.success(
                    localize('apps.backups_remote_added', 'Remote added')
                )
                return self.refreshAll()
            })
            .catch(Toaster.createCatcher())
    }

    deleteRemote(id: string) {
        const self = this
        self.apiManager
            .deleteBackupRemote(id)
            .then(function () {
                message.success(
                    localize('apps.backups_remote_deleted', 'Remote deleted')
                )
                return self.refreshAll()
            })
            .catch(Toaster.createCatcher())
    }

    testRemote(id: string) {
        const self = this
        self.apiManager
            .testBackupRemote(id)
            .then(function (res: any) {
                if (res && res.ok) {
                    message.success(
                        localize(
                            'apps.backups_remote_ok',
                            'Remote is reachable'
                        )
                    )
                } else {
                    self.showLog(
                        localize(
                            'apps.backups_remote_test_failed',
                            'Remote test failed'
                        ),
                        (res && res.output) || ''
                    )
                }
            })
            .catch(Toaster.createCatcher())
    }

    viewJobLog(job: IBackupJobRecord) {
        const self = this
        self.apiManager
            .getAppBackupJobLog(self.appName, job.id)
            .then(function (res: any) {
                self.showLog(`${job.type} — ${job.id}`, (res && res.log) || '')
            })
            .catch(Toaster.createCatcher())
    }

    showLog(title: string, content: string) {
        this.setState({ logModal: { visible: true, title, content } })
    }

    render() {
        const self = this
        const { config, remotes } = this.state
        const namedVolumes = (
            this.props.apiData.appDefinition.volumes || []
        ).filter((v) => !!v.volumeName)

        return (
            <div>
                {this.renderRemotesCard()}

                <div style={{ height: 30 }} />

                <Card
                    title={localize(
                        'apps.backups_config_title',
                        'Backup configuration'
                    )}
                >
                    {namedVolumes.length === 0 ? (
                        <p>
                            {localize(
                                'apps.backups_no_volumes',
                                'This app has no named (persistent) volumes to back up.'
                            )}
                        </p>
                    ) : (
                        <div>
                            <Row style={{ marginBottom: 16 }}>
                                <Col span={24}>
                                    <Switch
                                        checked={config.enabled}
                                        onChange={(checked) =>
                                            self.updateConfig({
                                                enabled: checked,
                                            })
                                        }
                                    />{' '}
                                    {localize(
                                        'apps.backups_enable',
                                        'Enable backups for this app'
                                    )}
                                </Col>
                            </Row>

                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                <Col xs={24} lg={12}>
                                    <div>
                                        {localize(
                                            'apps.backups_remote',
                                            'Destination remote'
                                        )}
                                    </div>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={config.remoteId || undefined}
                                        placeholder={localize(
                                            'apps.backups_select_remote',
                                            'Select a remote'
                                        )}
                                        onChange={(value) =>
                                            self.updateConfig({
                                                remoteId: value,
                                            })
                                        }
                                        options={remotes.map((r) => ({
                                            value: r.id,
                                            label: `${r.name} (${r.type})`,
                                        }))}
                                    />
                                </Col>
                                <Col xs={24} lg={12}>
                                    <div>
                                        {localize(
                                            'apps.backups_remote_path',
                                            'Destination path (bucket / folder)'
                                        )}
                                    </div>
                                    <Input
                                        value={config.remotePath}
                                        placeholder="my-bucket/caprover"
                                        onChange={(e) =>
                                            self.updateConfig({
                                                remotePath: e.target.value,
                                            })
                                        }
                                    />
                                </Col>
                            </Row>

                            <Row style={{ marginBottom: 16 }}>
                                <Col span={24}>
                                    <div style={{ marginBottom: 8 }}>
                                        {localize(
                                            'apps.backups_volumes',
                                            'Volumes to back up'
                                        )}
                                    </div>
                                    {namedVolumes.map((v) =>
                                        self.renderVolumeRow(
                                            v.volumeName as string,
                                            v.containerPath
                                        )
                                    )}
                                </Col>
                            </Row>

                            <Row gutter={16} style={{ marginBottom: 16 }}>
                                <Col xs={24} lg={12}>
                                    <div>
                                        {localize(
                                            'apps.backups_schedule',
                                            'Schedule'
                                        )}
                                    </div>
                                    <Select
                                        style={{ width: '100%' }}
                                        value={self.state.schedulePreset}
                                        onChange={(value) => {
                                            if (value === 'custom') {
                                                self.setState({
                                                    schedulePreset: 'custom',
                                                })
                                            } else {
                                                self.setState({
                                                    schedulePreset: value,
                                                })
                                                self.updateConfig({
                                                    cronSchedule: value,
                                                })
                                            }
                                        }}
                                        options={SCHEDULE_PRESETS}
                                    />
                                    {self.state.schedulePreset === 'custom' && (
                                        <Input
                                            style={{ marginTop: 8 }}
                                            placeholder="0 3 * * *"
                                            value={config.cronSchedule}
                                            onChange={(e) =>
                                                self.updateConfig({
                                                    cronSchedule:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    )}
                                </Col>
                                <Col xs={24} lg={12}>
                                    <div>
                                        <Tooltip
                                            title={localize(
                                                'apps.backups_retention_hint',
                                                'Keep timestamped snapshots of changed/deleted files for this many days. 0 = mirror only.'
                                            )}
                                        >
                                            {localize(
                                                'apps.backups_retention',
                                                'Snapshot retention (days)'
                                            )}
                                        </Tooltip>
                                    </div>
                                    <InputNumber
                                        min={0}
                                        style={{ width: '100%' }}
                                        value={config.retentionDays}
                                        onChange={(value) =>
                                            self.updateConfig({
                                                retentionDays: value || 0,
                                            })
                                        }
                                    />
                                </Col>
                            </Row>

                            <Collapse
                                style={{ marginBottom: 16 }}
                                items={[
                                    {
                                        key: 'hooks',
                                        label: localize(
                                            'apps.backups_hooks_title',
                                            'Consistency hooks (for databases)'
                                        ),
                                        children: (
                                            <div>
                                                <p style={{ opacity: 0.7 }}>
                                                    {localize(
                                                        'apps.backups_hooks_hint',
                                                        'Commands run inside the running container (via sh -c). Use a pre-backup dump into a backed-up volume (e.g. pg_dump ... > /backup/dump.sql) for a consistent copy, and a post-restore command to reload it.'
                                                    )}
                                                </p>
                                                {this.renderHookField(
                                                    'preBackupCommand',
                                                    localize(
                                                        'apps.backups_pre_backup',
                                                        'Pre-backup command'
                                                    ),
                                                    'pg_dump -U postgres app > /backup/dump.sql'
                                                )}
                                                {this.renderHookField(
                                                    'postBackupCommand',
                                                    localize(
                                                        'apps.backups_post_backup',
                                                        'Post-backup command'
                                                    ),
                                                    'rm -f /backup/dump.sql'
                                                )}
                                                {this.renderHookField(
                                                    'preRestoreCommand',
                                                    localize(
                                                        'apps.backups_pre_restore',
                                                        'Pre-restore command'
                                                    )
                                                )}
                                                {this.renderHookField(
                                                    'postRestoreCommand',
                                                    localize(
                                                        'apps.backups_post_restore',
                                                        'Post-restore command'
                                                    ),
                                                    'psql -U postgres app < /backup/dump.sql'
                                                )}
                                            </div>
                                        ),
                                    },
                                ]}
                            />

                            <Row>
                                <Col span={24}>
                                    <Button
                                        type="primary"
                                        onClick={() => self.saveConfig()}
                                    >
                                        {localize(
                                            'apps.backups_save',
                                            'Save backup settings'
                                        )}
                                    </Button>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                        }}
                                    />
                                    <Button
                                        icon={<CloudUploadOutlined />}
                                        disabled={!config.enabled}
                                        onClick={() => self.runBackupNow()}
                                    >
                                        {localize(
                                            'apps.backups_backup_now',
                                            'Back up now'
                                        )}
                                    </Button>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 12,
                                        }}
                                    />
                                    <Popconfirm
                                        title={localize(
                                            'apps.backups_restore_confirm',
                                            'Restore will overwrite the current volume data. Continue?'
                                        )}
                                        onConfirm={() => self.runRestoreNow()}
                                    >
                                        <Button
                                            danger
                                            disabled={!config.enabled}
                                        >
                                            {localize(
                                                'apps.backups_restore',
                                                'Restore latest'
                                            )}
                                        </Button>
                                    </Popconfirm>
                                </Col>
                            </Row>
                        </div>
                    )}
                </Card>

                <div style={{ height: 30 }} />

                {this.renderHistoryCard()}

                <RcloneRemoteForm
                    visible={this.state.remoteFormVisible}
                    onCancel={() => this.setState({ remoteFormVisible: false })}
                    onSubmit={(name, type, params) =>
                        this.createRemote(name, type, params)
                    }
                />

                <Modal
                    title={this.state.logModal.title}
                    open={this.state.logModal.visible}
                    footer={<div />}
                    width={800}
                    onCancel={() =>
                        this.setState({
                            logModal: {
                                visible: false,
                                title: '',
                                content: '',
                            },
                        })
                    }
                >
                    <pre
                        style={{
                            maxHeight: 400,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                        }}
                    >
                        {this.state.logModal.content ||
                            localize('apps.backups_no_log', '(no log output)')}
                    </pre>
                </Modal>
            </div>
        )
    }

    renderRemotesCard() {
        const self = this
        return (
            <Card
                title={localize(
                    'apps.backups_remotes_title',
                    'Backup destinations (rclone remotes)'
                )}
                extra={
                    <Button
                        onClick={() =>
                            self.setState({ remoteFormVisible: true })
                        }
                    >
                        {localize('apps.backups_add', 'Add destination')}
                    </Button>
                }
            >
                {self.state.remotes.length === 0 ? (
                    <p>
                        {localize(
                            'apps.backups_no_remotes',
                            'No backup destinations configured yet.'
                        )}
                    </p>
                ) : (
                    self.state.remotes.map((r) => (
                        <Row
                            key={r.id}
                            style={{ marginBottom: 8 }}
                            align="middle"
                        >
                            <Col flex="auto">
                                <strong>{r.name}</strong> <Tag>{r.type}</Tag>
                            </Col>
                            <Col>
                                <Button
                                    size="small"
                                    onClick={() => self.testRemote(r.id)}
                                >
                                    {localize('apps.backups_test', 'Test')}
                                </Button>
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: 8,
                                    }}
                                />
                                <Popconfirm
                                    title={localize(
                                        'apps.backups_delete_remote_confirm',
                                        'Delete this remote?'
                                    )}
                                    onConfirm={() => self.deleteRemote(r.id)}
                                >
                                    <Button
                                        size="small"
                                        danger
                                        icon={<DeleteOutlined />}
                                    />
                                </Popconfirm>
                            </Col>
                        </Row>
                    ))
                )}
            </Card>
        )
    }

    renderHistoryCard() {
        const self = this
        const statusColor: { [k: string]: string } = {
            running: 'blue',
            success: 'green',
            failed: 'red',
        }
        const columns = [
            {
                title: localize('apps.backups_col_type', 'Type'),
                dataIndex: 'type',
                key: 'type',
            },
            {
                title: localize('apps.backups_col_status', 'Status'),
                dataIndex: 'status',
                key: 'status',
                render: (status: string) => (
                    <Tag color={statusColor[status] || 'default'}>{status}</Tag>
                ),
            },
            {
                title: localize('apps.backups_col_started', 'Started'),
                dataIndex: 'startedAt',
                key: 'startedAt',
                render: (startedAt: number) =>
                    new Date(startedAt).toLocaleString(),
            },
            {
                title: localize('apps.backups_col_actions', 'Actions'),
                key: 'actions',
                render: (_: any, job: IBackupJobRecord) => (
                    <Button size="small" onClick={() => self.viewJobLog(job)}>
                        {localize('apps.backups_view_log', 'View log')}
                    </Button>
                ),
            },
        ]

        return (
            <Card
                title={localize('apps.backups_history_title', 'Backup history')}
                extra={
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => self.refreshAll()}
                    >
                        {localize('apps.backups_refresh', 'Refresh')}
                    </Button>
                }
            >
                <Table<IBackupJobRecord>
                    rowKey="id"
                    dataSource={self.state.jobs}
                    columns={columns}
                    loading={self.state.isLoading}
                    pagination={{ pageSize: 10 }}
                    size="small"
                />
            </Card>
        )
    }
}
