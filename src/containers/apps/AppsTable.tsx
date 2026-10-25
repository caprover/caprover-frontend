import {
    CaretRightOutlined,
    CheckOutlined,
    DeleteOutlined,
    DisconnectOutlined,
    FolderAddOutlined,
    FolderOpenOutlined,
    LinkOutlined,
    LoadingOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons'

import type { TreeDataNode, TreeProps } from 'antd'
import {
    Button,
    Card,
    Drawer,
    Empty,
    Input,
    Row,
    Splitter,
    Table,
    Tag,
    Tooltip,
    Tree,
    TreeSelect,
} from 'antd'
import { CapRoverModels } from 'caprover-api'
import { ExternalLink, HardDrive, Search } from 'lucide-react'
import { ColumnProps } from 'antd/lib/table'
import { History } from 'history'
import React, { Component, Fragment, Key } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import ApiManager from '../../api/ApiManager'
import { IMobileComponent } from '../../models/ContainerProps'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import Logger from '../../utils/Logger'
import StorageHelper from '../../utils/StorageHelper'
import Utils from '../../utils/Utils'
import NewTabLink from '../global/NewTabLink'
import Timestamp from '../global/Timestamp'
import { IAppDef } from './AppDefinition'
import AppRuntimeStatus, { RuntimeDataStatus } from './AppRuntimeStatus'
import CreateNewApp from './CreateNewApp'
import onDeleteAppClicked from './DeleteAppConfirm'
import DescriptionPanel from './DescriptionPanel'
import EditableSpan from './EditableSpan'

const ALL_APPS = 'ALL_APPS'
const ROOT_APPS = 'ROOT_APPS'

type TableData = IAppDef & { lastDeployTime: string }

class LastSelectedKeyMemoryCache {
    static selectedKey = ALL_APPS
    static expandedKeys = [ROOT_APPS] as string[]
}

class AppsTable extends Component<
    {
        history: History
        apps: IAppDef[]
        appsRuntimeData: CapRoverModels.AppsRuntimeResponse | undefined
        runtimeDataStatus: RuntimeDataStatus
        projects: ProjectDefinition[]
        apiManager: ApiManager
        onReloadRequested: () => void
        rootDomain: string
        defaultNginxConfig: string
        isMobile: boolean
        search: string | undefined
        isCreatingApp: boolean
        onCreateNewAppClicked: (
            appName: string,
            projectId: string,
            hasPersistency: boolean
        ) => void
    },
    {
        searchTerm: string
        showProjects: boolean
        isBulkEditMode: boolean
        checkedAppKeys: React.Key[]
        checkedProjectKeys: React.Key[]
        selectedProjectId: string // project ID, ROOT_APPS, or ALL_APPS
    }
> {
    constructor(props: any) {
        super(props)
        const urlsQuery = new URLSearchParams(props.search || '').get('q') || ''
        this.state = {
            searchTerm: urlsQuery,
            showProjects: false,
            isBulkEditMode: false,
            checkedAppKeys: [],
            checkedProjectKeys: [],
            selectedProjectId: LastSelectedKeyMemoryCache.selectedKey,
        }
    }

    appDetailPath(appName: string) {
        return `/apps/details/${appName}`
    }

    getAppRuntime(appName: string) {
        return this.props.appsRuntimeData?.apps?.find(
            (runtime) => runtime.appName === appName
        )
    }

    createColumns() {
        const self = this
        const columns: ColumnProps<TableData>[] = [
            {
                title: localize('apps_table.application', 'Application'),
                dataIndex: 'appName',
                key: 'appName',
                width: '25%',
                ellipsis: true,
                render: (appName: string) => (
                    <div className="app-identity">
                        <AppRuntimeStatus
                            appName={appName}
                            runtime={self.getAppRuntime(appName)}
                            runtimeDataStatus={self.props.runtimeDataStatus}
                            appDetailsPath={self.appDetailPath(appName)}
                            isMobile={self.props.isMobile}
                        />
                        <Link
                            className="app-name-link"
                            title={appName}
                            to={this.appDetailPath(appName)}
                        >
                            {appName}
                        </Link>
                    </div>
                ),
                sorter: (a, b) => {
                    return a.appName
                        ? a.appName.localeCompare(b.appName || '')
                        : 0
                },
                sortDirections: ['descend', 'ascend'],
            },
            {
                title: localize('apps_table.storage', 'Storage'),
                dataIndex: 'hasPersistentData',
                width: 104,
                key: 'hasPersistentData',
                align: 'left',
                render: (hasPersistentData: boolean) => {
                    if (!hasPersistentData) {
                        return <span />
                    }

                    return (
                        <Tooltip
                            trigger={['hover', 'focus']}
                            title={localize(
                                'apps_table.persistent_data',
                                'Persistent Data'
                            )}
                        >
                            <span
                                className="storage-icon"
                                role="img"
                                tabIndex={0}
                                aria-label={localize(
                                    'apps_table.persistent_data',
                                    'Persistent Data'
                                )}
                            >
                                <HardDrive size={16} />
                            </span>
                        </Tooltip>
                    )
                },
            },
            {
                title: localize('apps_table.instances', 'Instances'),
                dataIndex: 'instanceCount',
                key: 'instanceCount',
                width: 112,
                align: 'right',
            },
            {
                title: localize('apps_table.tags', 'Tags'),
                dataIndex: 'tags',
                key: 'tags',
                align: 'left',
                render: (_: any, app: TableData) => {
                    return (
                        <Fragment>
                            {app.tags && app.tags.length > 0 ? (
                                app.tags.map((it) => (
                                    <Tag key={it.tagName} className="app-tag">
                                        <a
                                            href="/"
                                            onClick={(e) => {
                                                e.preventDefault()
                                                self.setState({
                                                    searchTerm:
                                                        'tag:' + it.tagName,
                                                })
                                            }}
                                        >
                                            <span className="unselectable-span">
                                                {it.tagName}
                                            </span>
                                        </a>
                                    </Tag>
                                ))
                            ) : (
                                <span></span>
                            )}
                        </Fragment>
                    )
                },
            },
            {
                title: localize('apps_table.deployed', 'Deployed'),
                dataIndex: 'lastDeployTime',
                key: 'lastDeployTime',
                width: 180,
                align: 'left',
                sorter: (a, b) => {
                    return (
                        Date.parse(a.lastDeployTime) -
                        Date.parse(b.lastDeployTime)
                    )
                },
                sortDirections: ['descend', 'ascend'],
                render: (lastDeployTime: string, app) => {
                    if (!lastDeployTime) {
                        return <span />
                    }

                    return (
                        <span>
                            <Timestamp timestamp={lastDeployTime} relative />
                            {!!app.isAppBuilding ? (
                                <LoadingOutlined
                                    style={{
                                        fontSize: '12px',
                                        marginInlineStart: 12,
                                    }}
                                />
                            ) : undefined}
                        </span>
                    )
                },
            },
            {
                title: localize('apps_table.open', 'Open'),
                dataIndex: 'notExposeAsWebApp',
                key: 'openInBrowser',
                width: 72,
                align: 'center',
                render: (notExposeAsWebApp: boolean, app) => {
                    if (notExposeAsWebApp) {
                        return (
                            <Tooltip
                                title={localize(
                                    'apps_table.not_exposed_tooltip',
                                    'Not exposed as a web app'
                                )}
                            >
                                <DisconnectOutlined />
                            </Tooltip>
                        )
                    }

                    return (
                        <NewTabLink
                            className="table-icon-action"
                            title={localize(
                                'apps_table.open_application',
                                'Open application'
                            )}
                            url={`http${
                                app.hasDefaultSubDomainSsl ? 's' : ''
                            }://${app.appName}.${self.props.rootDomain}`}
                        >
                            <ExternalLink size={16} />
                        </NewTabLink>
                    )
                },
            },
        ]

        // Set default sort order
        const sortKey = window.localStorage.appsSortKey || 'appName'
        const sortOrder = window.localStorage.appsSortOrder || 'ascend'
        const sorted =
            columns.find((column) => column.key === sortKey) || columns[0]
        sorted.defaultSortOrder = sortOrder

        return columns
    }

    render() {
        const self = this

        const appsToRender = self.props.apps
            .filter((app) => {
                const searchTerm = self.state.searchTerm
                if (!searchTerm) return true

                if (searchTerm.startsWith('tag:')) {
                    const entries = searchTerm.substring(4).split(' ')
                    const tagToFilter = entries[0]
                    const tagExists =
                        (app.tags || []).filter((t) =>
                            t.tagName.startsWith(tagToFilter)
                        ).length > 0
                    if (entries.length > 1) {
                        const appNameToFilter = searchTerm
                            .substring(4)
                            .split(' ')[1]
                        return (
                            tagExists &&
                            app.appName!.indexOf(appNameToFilter) >= 0
                        )
                    }
                    return tagExists
                }

                return (
                    app.appName!.includes(searchTerm) ||
                    app.customDomain.some((domain) =>
                        domain.publicDomain.includes(searchTerm)
                    )
                )
            })
            .filter((app) => {
                const selectedProjectId = self.state.selectedProjectId

                if (selectedProjectId === ALL_APPS) return true

                if (selectedProjectId === ROOT_APPS) return !app.projectId

                return app.projectId === selectedProjectId
            })
            .map((app) => {
                let versionFound = app.versions.filter(
                    (v) => v.version === app.deployedVersion
                )

                let lastDeployTime = ''

                if (versionFound.length === 0) {
                    // See https://github.com/caprover/caprover-frontend/issues/56
                    // This can happen when user creates a new app while a build is in progress.
                    // This results in app.versions being an empty array until the 0th version gets deployed.
                    Logger.error(
                        `App ${app.appName} has invalid deployVersion=${
                            app.deployedVersion
                        }, versions:${JSON.stringify(app.versions)}`
                    )
                } else {
                    lastDeployTime = versionFound[0].timeStamp || ''
                }

                return { ...app, lastDeployTime }
            })

        const searchAppInput = (
            <Input
                prefix={<Search size={14} />}
                aria-label={localize(
                    'apps_table.search_input_placeholder',
                    'Search by Name'
                )}
                placeholder={localize(
                    'apps_table.search_input_placeholder',
                    'Search by Name'
                )}
                type="text"
                value={self.state.searchTerm}
                defaultValue={self.state.searchTerm}
                onChange={(event) =>
                    self.setState({
                        searchTerm: (event.target.value || '')
                            .trim()
                            .toLowerCase(),
                    })
                }
            />
        )

        return (
            <Card
                className="apps-page"
                extra={
                    <div className="apps-actions">
                        {self.props.isMobile && (
                            <Button
                                icon={<FolderOpenOutlined />}
                                onClick={() =>
                                    self.setState({ showProjects: true })
                                }
                            >
                                {localize(
                                    'apps.delete_app_projects_list',
                                    'Projects'
                                )}
                            </Button>
                        )}

                        <CreateNewApp
                            projects={self.props.projects}
                            history={self.props.history}
                            isCreatingApp={self.props.isCreatingApp}
                            onCreateNewAppClicked={
                                self.props.onCreateNewAppClicked
                            }
                        />
                        {self.state.isBulkEditMode && (
                            <Tooltip
                                title={localize(
                                    'apps_table.bulk_delete_tooltip',
                                    'Delete selected apps and projects'
                                )}
                            >
                                <Button
                                    disabled={
                                        (!self.state.checkedAppKeys ||
                                            self.state.checkedAppKeys.length ===
                                                0) &&
                                        (!self.state.checkedProjectKeys ||
                                            self.state.checkedProjectKeys
                                                .length === 0)
                                    }
                                    type="text"
                                    danger={true}
                                    onClick={() => {
                                        onDeleteAppClicked(
                                            self.props.apps.filter(
                                                (a) =>
                                                    a.appName &&
                                                    self.state.checkedAppKeys.includes(
                                                        a.appName
                                                    )
                                            ),
                                            self.props.projects.filter(
                                                (a) =>
                                                    a.id &&
                                                    self.state.checkedProjectKeys.includes(
                                                        a.id
                                                    )
                                            ),
                                            self.props.apiManager,
                                            (success) => {
                                                // with or without errors, let's refresh the page
                                                self.props.onReloadRequested()
                                            }
                                        )
                                    }}
                                >
                                    <DeleteOutlined />
                                </Button>
                            </Tooltip>
                        )}
                        <Button
                            type="text"
                            title={localize(
                                'apps_table.bulk_edit',
                                'Select apps and projects'
                            )}
                            aria-label={localize(
                                'apps_table.bulk_edit',
                                'Select apps and projects'
                            )}
                            aria-pressed={self.state.isBulkEditMode}
                            onClick={() => {
                                const newState = !self.state.isBulkEditMode
                                self.setState({
                                    isBulkEditMode: newState,
                                })
                                if (!newState) {
                                    self.setState({
                                        checkedAppKeys: [],
                                        checkedProjectKeys: [],
                                    })
                                }
                            }}
                        >
                            <UnorderedListOutlined />
                        </Button>
                    </div>
                }
                title={
                    <div className="apps-heading">
                        <h1>
                            {localize('apps_table.title', 'Your Apps')}{' '}
                            <span className="count-badge">
                                {self.props.apps.length}
                            </span>
                        </h1>
                        {searchAppInput}
                        {self.props.isMobile && (
                            <TreeSelect
                                className="project-filter"
                                aria-label={localize(
                                    'apps_table.project_filter',
                                    'Filter by project'
                                )}
                                value={self.state.selectedProjectId}
                                fieldNames={{ value: 'key' }}
                                treeData={self.createProjectTreeData(
                                    self.props.projects
                                )}
                                treeDefaultExpandAll
                                onChange={(value: string) => {
                                    self.setState({ selectedProjectId: value })
                                    LastSelectedKeyMemoryCache.selectedKey =
                                        value
                                }}
                            />
                        )}
                    </div>
                }
            >
                {self.props.isMobile && (
                    <Drawer
                        title={localize(
                            'apps.delete_app_projects_list',
                            'Projects'
                        )}
                        open={self.state.showProjects}
                        onClose={() => self.setState({ showProjects: false })}
                        width={360}
                    >
                        {self.createProjectTreeView()}
                    </Drawer>
                )}
                {self.props.isMobile &&
                    self.state.selectedProjectId !== ALL_APPS &&
                    self.createAppTableHeader()}
                <Row justify="center">
                    {self.props.apps.length === 0 &&
                    (self.props.isMobile ||
                        self.props.projects.length === 0) ? (
                        <Empty
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={localize(
                                'apps_table.empty',
                                'Create your first application using Create App above.'
                            )}
                        />
                    ) : self.props.isMobile ? (
                        appsToRender.map(
                            ({
                                appName = '',
                                hasPersistentData,
                                notExposeAsWebApp,
                                instanceCount,
                                hasDefaultSubDomainSsl,
                            }) => (
                                <Card
                                    className="mobile-app-card"
                                    title={
                                        <div className="app-identity">
                                            <AppRuntimeStatus
                                                appName={appName}
                                                runtime={self.getAppRuntime(
                                                    appName
                                                )}
                                                runtimeDataStatus={
                                                    self.props.runtimeDataStatus
                                                }
                                                appDetailsPath={self.appDetailPath(
                                                    appName
                                                )}
                                                isMobile={self.props.isMobile}
                                            />
                                            <Link
                                                className="app-name-link"
                                                title={appName}
                                                to={self.appDetailPath(appName)}
                                            >
                                                {appName}
                                            </Link>
                                        </div>
                                    }
                                    key={appName}
                                    extra={
                                        <Link to={this.appDetailPath(appName)}>
                                            Details
                                        </Link>
                                    }
                                    style={{
                                        width: '100%',
                                        marginBottom: 8,
                                    }}
                                >
                                    <p>
                                        {localize(
                                            'apps_table.persistent_data',
                                            'Persistent Data'
                                        )}
                                        :{' '}
                                        {!hasPersistentData ? undefined : (
                                            <span>
                                                <CheckOutlined />
                                            </span>
                                        )}
                                    </p>
                                    <p>
                                        {localize(
                                            'apps_table.exposed_webapp',
                                            'Exposed Webapp'
                                        )}
                                        :{' '}
                                        {!!notExposeAsWebApp ? undefined : (
                                            <span>
                                                <CheckOutlined />
                                            </span>
                                        )}
                                    </p>
                                    <p>
                                        {localize(
                                            'apps_table.instance_count',
                                            'Instance Count'
                                        )}
                                        : {instanceCount}
                                    </p>
                                    <p>
                                        {localize(
                                            'apps_table.open_in_browser',
                                            'Open in Browser'
                                        )}
                                        :{' '}
                                        {!!notExposeAsWebApp ? undefined : (
                                            <NewTabLink
                                                url={`http${
                                                    hasDefaultSubDomainSsl
                                                        ? 's'
                                                        : ''
                                                }://${appName}.${
                                                    self.props.rootDomain
                                                }`}
                                            >
                                                <LinkOutlined />{' '}
                                            </NewTabLink>
                                        )}
                                    </p>
                                </Card>
                            )
                        )
                    ) : (
                        <div
                            style={{
                                width: '100%',
                            }}
                        >
                            <Splitter
                                className="apps-splitter"
                                onResizeEnd={(numbers) => {
                                    const initialPercent =
                                        numbers[0] / (numbers[0] + numbers[1])
                                    StorageHelper.setAppProjectSplitRatioInLocalStorage(
                                        initialPercent
                                    )
                                }}
                            >
                                <Splitter.Panel
                                    className="apps-project-pane"
                                    defaultSize={`${Math.floor(
                                        StorageHelper.getAppProjectSplitRatioFromLocalStorage() *
                                            100
                                    )}%`}
                                    min="10%"
                                    max="60%"
                                >
                                    {self.createProjectTreeView()}
                                </Splitter.Panel>
                                <Splitter.Panel className="apps-table-pane">
                                    {self.state.selectedProjectId !==
                                        ALL_APPS && self.createAppTableHeader()}
                                    <Table<TableData>
                                        rowKey="appName"
                                        columns={self.createColumns()}
                                        dataSource={appsToRender}
                                        pagination={false}
                                        scroll={{ x: 850 }}
                                        size="middle"
                                        rowSelection={
                                            self.state.isBulkEditMode
                                                ? {
                                                      selectedRowKeys:
                                                          self.state
                                                              .checkedAppKeys,
                                                      onChange: (
                                                          newSelectedRowKeys: React.Key[]
                                                      ) => {
                                                          self.setState({
                                                              checkedAppKeys:
                                                                  newSelectedRowKeys,
                                                          })
                                                      },
                                                  }
                                                : undefined
                                        }
                                        onChange={(
                                            pagination,
                                            filters,
                                            sorter
                                        ) => {
                                            // Persist sorter state
                                            if (!Array.isArray(sorter)) {
                                                window.localStorage.appsSortKey =
                                                    sorter.columnKey
                                                window.localStorage.appsSortOrder =
                                                    sorter.order
                                            }
                                        }}
                                    />

                                    {self.createDescriptionPanel()}
                                </Splitter.Panel>
                            </Splitter>
                        </div>
                    )}
                </Row>
            </Card>
        )
    }

    private createDescriptionPanel() {
        const self = this
        const selectedProject = self.props.projects.find(
            (it) => it.id === self.state.selectedProjectId
        )

        if (!selectedProject || !selectedProject.description) return <div />

        return (
            <DescriptionPanel
                headerText={localize(
                    'projects.edit_project_description',
                    'Description'
                )}
            >
                <div
                    style={{
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {selectedProject.description}
                </div>
            </DescriptionPanel>
        )
    }

    createAppTableHeader(): React.ReactNode {
        const self = this
        let projectName = <span></span>
        let editable = false

        if (this.state.selectedProjectId === ALL_APPS) {
            projectName = (
                <span>
                    {localize(
                        'apps_table.header_all_apps_projects',
                        'All apps from all projects'
                    )}
                </span>
            )
        } else if (this.state.selectedProjectId === ROOT_APPS) {
            projectName = (
                <span>
                    {localize(
                        'apps_table.header_root',
                        'Root (apps with no assigned projects)'
                    )}
                </span>
            )
        } else {
            editable = true
            const projectsMap: { [key: string]: ProjectDefinition } = {}
            self.props.projects.forEach((item) => {
                projectsMap[item.id] = item
            })

            const breadCrumbs: string[] = []

            breadCrumbs.push(self.state.selectedProjectId)

            let currentProjectId = self.state.selectedProjectId
            while (currentProjectId && projectsMap[currentProjectId]) {
                const currentProject = projectsMap[currentProjectId]
                if (currentProject.parentProjectId) {
                    breadCrumbs.unshift(currentProject.parentProjectId)
                    currentProjectId = currentProject.parentProjectId
                } else {
                    break
                }
            }

            projectName = (
                <span>
                    {breadCrumbs
                        .map((id) => projectsMap[id]?.name || '')
                        .map((name, index) => (
                            <Fragment key={name}>
                                <span
                                    style={{
                                        marginInlineStart: 5,
                                        marginInlineEnd: 5,
                                    }}
                                >
                                    {name}
                                </span>
                                {index < breadCrumbs.length - 1 && (
                                    <CaretRightOutlined />
                                )}
                            </Fragment>
                        ))}
                </span>
            )
        }

        if (!editable) {
            return <h4>{projectName}</h4>
        } else {
            const editProjectClicked = () => {
                self.props.history.push(
                    '/apps/projects/' + self.state.selectedProjectId
                )
            }

            return (
                <h4>
                    <EditableSpan onEditClick={editProjectClicked}>
                        <FolderOpenOutlined /> {projectName}
                    </EditableSpan>
                </h4>
            )
        }
    }

    createProjectTreeData(projects: ProjectDefinition[]): TreeDataNode[] {
        const projectsMap: { [key: string]: TreeDataNode } = {}
        let root: TreeDataNode[] = []

        // Create a map of all projects
        projects.forEach((item) => {
            projectsMap[item.id] = {
                title: item.name,
                key: item.id,
            }
        })

        // Distribute projects and apps to their respective parents or to the root
        projects.forEach((item) => {
            const project = projectsMap[item.id]
            if (item.parentProjectId && projectsMap[item.parentProjectId]) {
                const children =
                    projectsMap[item.parentProjectId].children || []

                children.push(project)
                projectsMap[item.parentProjectId].children = children
            } else {
                root.push(project)
            }
        })

        root.forEach((project) => {
            if (project.children)
                project.children =
                    project.children.length > 0 ? project.children : undefined
        })

        root = [
            {
                title: localize('apps_table.all_projects', 'All projects'),
                key: ALL_APPS,
                children: undefined,
                checkable: false,
            },
            {
                title: 'root',
                key: ROOT_APPS,
                children: root,
                checkable: false,
            },
        ]
        return root
    }

    createProjectTreeView(): React.ReactNode {
        const self = this
        const treeData: TreeDataNode[] = self.createProjectTreeData(
            self.props.projects
        )
        const onSelect: TreeProps['onSelect'] = (selectedKeys, info) => {
            const selectedKey =
                info.selected &&
                self.state.selectedProjectId !== `${info.node.key}`
                    ? `${info.node.key}`
                    : ALL_APPS
            self.setState({
                selectedProjectId: selectedKey,
            })
            LastSelectedKeyMemoryCache.selectedKey = selectedKey
            // info = {
            //     "event": "select",
            //     "selected": true,
            //     "node": {
            //       "title": "testing",
            //       "key": "ba0d06ae-d114-4094-a8d3-4bb91d9004bb",
            //       "expanded": false,
            //       "selected": false,
            //       "checked": false,
            //       "loaded": false,
            //       "loading": false,
            //       "halfChecked": false,
            //       "dragOver": false,
            //       "dragOverGapTop": false,
            //       "dragOverGapBottom": false,
            //       "pos": "0-2",
            //       "active": false
            //     },
            //     "selectedNodes": [
            //       {
            //         "title": "testing",
            //         "key": "ba0d06ae-d114-4094-a8d3-4bb91d9004bb"
            //       }
            //     ],
            //     "nativeEvent": {
            //       "isTrusted": true
            //     }
        }

        const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
            self.setState({
                checkedProjectKeys: (checkedKeys as any).length
                    ? checkedKeys
                    : (checkedKeys as any).checked,
            })
        }

        function onExpand(expandedKeys: Key[], _info: any) {
            LastSelectedKeyMemoryCache.expandedKeys = Utils.copyObject(
                expandedKeys.map((it) => it.toString())
            )
        }

        return (
            <div className="project-manager">
                <Row justify={'space-between'} align={'middle'}>
                    <h4 style={{ margin: 0 }}>
                        {localize('apps.delete_app_projects_list', 'Projects')}
                    </h4>
                    <Tooltip
                        title={localize(
                            'projects.new_project',
                            'Create a New Project'
                        )}
                    >
                        <Button
                            type="text"
                            size="small"
                            aria-label={localize(
                                'projects.new_project',
                                'Create a New Project'
                            )}
                            onClick={() => {
                                self.props.history.push('/apps/projects/new')
                            }}
                        >
                            <FolderAddOutlined />
                        </Button>
                    </Tooltip>
                </Row>
                <div className="section-divider" />
                <Tree.DirectoryTree
                    blockNode
                    checkStrictly={true}
                    showIcon={false}
                    checkable={!!self.state.isBulkEditMode}
                    defaultExpandedKeys={
                        LastSelectedKeyMemoryCache.expandedKeys
                    }
                    defaultSelectedKeys={[self.state.selectedProjectId]}
                    defaultCheckedKeys={[]}
                    selectedKeys={
                        self.state.selectedProjectId
                            ? [self.state.selectedProjectId]
                            : []
                    }
                    checkedKeys={self.state.checkedProjectKeys}
                    onSelect={onSelect}
                    autoExpandParent={true}
                    defaultExpandAll={true}
                    onCheck={onCheck}
                    onExpand={onExpand}
                    treeData={treeData}
                    titleRender={(nodeData: TreeDataNode) => {
                        const title = `${nodeData.title}`

                        if (self.state.selectedProjectId === nodeData.key) {
                            return (
                                <span>
                                    <b>{title}</b>
                                </span>
                            )
                        }

                        return <span>{title}</span>
                    }}
                />
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect<IMobileComponent, any, any>(
    mapStateToProps,
    undefined
)(AppsTable)
