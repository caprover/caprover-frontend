import {
    CaretRightOutlined,
    CheckOutlined,
    CodeOutlined,
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
    Input,
    Row,
    Splitter,
    Table,
    Tag,
    Tooltip,
    Tree,
} from 'antd'
import { ColumnProps } from 'antd/lib/table'
import { History } from 'history'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import ApiManager from '../../api/ApiManager'
import { IMobileComponent } from '../../models/ContainerProps'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import Logger from '../../utils/Logger'
import StorageHelper from '../../utils/StorageHelper'
import NewTabLink from '../global/NewTabLink'
import Timestamp from '../global/Timestamp'
import { IAppDef } from './AppDefinition'
import onDeleteAppClicked from './DeleteAppConfirm'
import DescriptionPanel from './DescriptionPanel'
import EditableSpan from './EditableSpan'

const ALL_APPS = 'ALL_APPS'
const ROOT_APPS = 'ROOT_APPS'

type TableData = IAppDef & { lastDeployTime: string }

class AppsTable extends Component<
    {
        history: History
        apps: IAppDef[]
        projects: ProjectDefinition[]
        apiManager: ApiManager
        onReloadRequested: () => void
        rootDomain: string
        defaultNginxConfig: string
        isMobile: boolean
        search: string | undefined
    },
    {
        searchTerm: string
        isBulkEditMode: boolean
        selectedAppKeys: React.Key[]
        selectedProjectKeys: React.Key[]
        selectedProjectId: string // project ID, ROOT_APPS, or ALL_APPS
    }
> {
    constructor(props: any) {
        super(props)
        const urlsQuery = new URLSearchParams(props.search || '').get('q') || ''
        this.state = {
            searchTerm: urlsQuery,
            isBulkEditMode: false,
            selectedAppKeys: [],
            selectedProjectKeys: [],
            selectedProjectId: ALL_APPS,
        }
    }

    appDetailPath(appName: string) {
        return `/apps/details/${appName}`
    }

    createColumns() {
        const self = this
        const ALIGN: 'center' = 'center'
        const columns: ColumnProps<TableData>[] = [
            {
                title: localize('apps_table.app_name', 'App Name'),
                dataIndex: 'appName',
                key: 'appName',
                width: '25%',
                render: (appName: string) => (
                    <Link to={this.appDetailPath(appName)}>{appName}</Link>
                ),
                sorter: (a, b) => {
                    return a.appName
                        ? a.appName.localeCompare(b.appName || '')
                        : 0
                },
                sortDirections: ['descend', 'ascend'],
            },
            {
                title: localize(
                    'apps_table.persistent_data',
                    'Persistent Data'
                ),
                dataIndex: 'hasPersistentData',
                width: '10%',
                key: 'hasPersistentData',
                align: ALIGN,
                render: (hasPersistentData: boolean) => {
                    if (!hasPersistentData) {
                        return <span />
                    }

                    return (
                        <span>
                            <CheckOutlined />
                        </span>
                    )
                },
            },
            {
                title: localize('apps_table.instance_count', 'Instance Count'),
                dataIndex: 'instanceCount',
                key: 'instanceCount',
                width: '10%',
                align: ALIGN,
            },
            {
                title: localize('apps_table.tags', 'Tags'),
                dataIndex: 'tags',
                key: 'tags',
                align: ALIGN,
                render: (_: any, app: TableData) => {
                    return (
                        <Fragment>
                            {app.tags && app.tags.length > 0 ? (
                                app.tags.map((it) => (
                                    <Tag key={it.tagName} style={{ margin: 2 }}>
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
                title: localize('apps_table.last_deployed', 'Last Deployed'),
                dataIndex: 'lastDeployTime',
                key: 'lastDeployTime',
                width: '20%',
                align: ALIGN,
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
                            <Timestamp timestamp={lastDeployTime} />
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
                width: '60px',
                align: ALIGN,
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
                            url={`http${
                                app.hasDefaultSubDomainSsl ? 's' : ''
                            }://${app.appName}.${self.props.rootDomain}`}
                        >
                            <LinkOutlined />{' '}
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

                return app.appName!.indexOf(searchTerm) >= 0
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
                extra={
                    <div>
                        {self.state.isBulkEditMode && (
                            <Tooltip
                                title={localize(
                                    'apps_table.bulk_delete_tooltip',
                                    'Delete selected apps and projects'
                                )}
                            >
                                <Button
                                    disabled={
                                        (!self.state.selectedAppKeys ||
                                            self.state.selectedAppKeys
                                                .length === 0) &&
                                        (!self.state.selectedProjectKeys ||
                                            self.state.selectedProjectKeys
                                                .length === 0)
                                    }
                                    type="text"
                                    danger={true}
                                    onClick={() => {
                                        onDeleteAppClicked(
                                            self.props.apps.filter(
                                                (a) =>
                                                    a.appName &&
                                                    self.state.selectedAppKeys.includes(
                                                        a.appName
                                                    )
                                            ),
                                            self.props.projects.filter(
                                                (a) =>
                                                    a.id &&
                                                    self.state.selectedProjectKeys.includes(
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
                            onClick={() => {
                                const newState = !self.state.isBulkEditMode
                                self.setState({
                                    isBulkEditMode: newState,
                                })
                                if (!newState) {
                                    self.setState({
                                        selectedAppKeys: [],
                                        selectedProjectKeys: [],
                                    })
                                }
                            }}
                        >
                            <UnorderedListOutlined />
                        </Button>
                    </div>
                }
                title={
                    <div
                        style={{
                            paddingTop: 18,
                            paddingBottom: 18,
                        }}
                    >
                        <div>
                            <div style={{ maxWidth: 250 }}>
                                <CodeOutlined />
                                <span
                                    style={{
                                        marginInlineEnd: 20,
                                        marginInlineStart: 5,
                                    }}
                                >
                                    {localize('apps_table.title', 'Your Apps')}
                                </span>
                                {!self.props.isMobile && searchAppInput}
                            </div>
                        </div>

                        {self.props.isMobile && (
                            <div style={{ marginTop: 8 }}>{searchAppInput}</div>
                        )}
                    </div>
                }
            >
                <Row justify="center">
                    {self.props.isMobile ? (
                        appsToRender.map(
                            ({
                                appName = '',
                                hasPersistentData,
                                notExposeAsWebApp,
                                instanceCount,
                                hasDefaultSubDomainSsl,
                            }) => (
                                <Card
                                    type="inner"
                                    title={appName}
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
                                        Persistent Data:{' '}
                                        {!hasPersistentData ? undefined : (
                                            <span>
                                                <CheckOutlined />
                                            </span>
                                        )}
                                    </p>
                                    <p>
                                        Exposed Webapp:{' '}
                                        {!!notExposeAsWebApp ? undefined : (
                                            <span>
                                                <CheckOutlined />
                                            </span>
                                        )}
                                    </p>
                                    <p>Instance Count: {instanceCount}</p>
                                    <p>
                                        Open in Browser:{' '}
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
                                onResizeEnd={(numbers) => {
                                    const initialPercent =
                                        numbers[0] / (numbers[0] + numbers[1])
                                    StorageHelper.setAppProjectSplitRatioInLocalStorage(
                                        initialPercent
                                    )
                                }}
                                style={{
                                    marginBottom: 16,
                                }}
                            >
                                <Splitter.Panel
                                    style={{ marginInlineEnd: 10 }}
                                    defaultSize={`${Math.floor(
                                        StorageHelper.getAppProjectSplitRatioFromLocalStorage() *
                                            100
                                    )}%`}
                                    min="10%"
                                    max="60%"
                                >
                                    {self.createProjectTreeView()}
                                </Splitter.Panel>
                                <Splitter.Panel
                                    style={{ marginInlineStart: 10 }}
                                >
                                    {self.createAppTableHeader()}
                                    <Table<TableData>
                                        rowKey="appName"
                                        columns={self.createColumns()}
                                        dataSource={appsToRender}
                                        pagination={false}
                                        size="middle"
                                        rowSelection={
                                            self.state.isBulkEditMode
                                                ? {
                                                      selectedRowKeys:
                                                          self.state
                                                              .selectedAppKeys,
                                                      onChange: (
                                                          newSelectedRowKeys: React.Key[]
                                                      ) => {
                                                          self.setState({
                                                              selectedAppKeys:
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
                            <>
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
                            </>
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
            self.setState({
                selectedProjectId:
                    info.selected &&
                    self.state.selectedProjectId !== `${info.node.key}`
                        ? `${info.node.key}`
                        : ALL_APPS,
            })

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
                selectedProjectKeys: (checkedKeys as any).length
                    ? checkedKeys
                    : (checkedKeys as any).checked,
            })
        }

        return (
            <Card style={{ height: '100%' }}>
                <Row
                    justify={'space-between'}
                    align={'middle'}
                    style={{
                        marginInlineStart: -18,
                        marginTop: -10,
                    }}
                >
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
                            type="default"
                            shape="circle"
                            onClick={() => {
                                self.props.history.push('/apps/projects/new')
                            }}
                        >
                            <FolderAddOutlined />
                        </Button>
                    </Tooltip>
                </Row>
                <hr
                    style={{
                        marginInlineStart: -18,
                        marginBottom: 20,
                        marginInlineEnd: 0,
                    }}
                />
                <Tree.DirectoryTree
                    style={{ marginInlineStart: -22, position: 'absolute' }}
                    showLine
                    checkStrictly={true}
                    showIcon={false}
                    checkable={!!self.state.isBulkEditMode}
                    defaultExpandedKeys={[ROOT_APPS]}
                    defaultSelectedKeys={[]}
                    defaultCheckedKeys={[]}
                    selectedKeys={
                        self.state.selectedProjectId
                            ? [self.state.selectedProjectId]
                            : []
                    }
                    checkedKeys={self.state.selectedProjectKeys}
                    onSelect={onSelect}
                    onCheck={onCheck}
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
            </Card>
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
