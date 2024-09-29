import {
    CheckOutlined,
    CodeOutlined,
    DeleteOutlined,
    DisconnectOutlined,
    EditOutlined,
    LinkOutlined,
    LoadingOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons'

import type { TreeDataNode, TreeProps } from 'antd'
import { Button, Card, Col, Input, Row, Table, Tag, Tooltip, Tree } from 'antd'
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
import ClickableLink from '../global/ClickableLink'
import NewTabLink from '../global/NewTabLink'
import Timestamp from '../global/Timestamp'
import { IAppDef } from './AppDefinition'
import onDeleteAppClicked from './DeleteAppConfirm'

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
        selectedRowKeys: React.Key[]
        selectedProjectId: string // project ID, ROOT_APPS, or ALL_APPS
    }
> {
    constructor(props: any) {
        super(props)
        const urlsQuery = new URLSearchParams(props.search || '').get('q') || ''
        this.state = {
            searchTerm: urlsQuery,
            isBulkEditMode: false,
            selectedRowKeys: [],
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
                                        marginLeft: 12,
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
                                    'Delete selected apps'
                                )}
                            >
                                <Button
                                    disabled={
                                        !self.state.selectedRowKeys ||
                                        self.state.selectedRowKeys.length === 0
                                    }
                                    type="text"
                                    danger={true}
                                    onClick={() => {
                                        onDeleteAppClicked(
                                            self.props.apps.filter(
                                                (a) =>
                                                    a.appName &&
                                                    self.state.selectedRowKeys.includes(
                                                        a.appName
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
                                if (!newState)
                                    self.setState({ selectedRowKeys: [] })
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
                                    style={{ marginRight: 20, marginLeft: 5 }}
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
                            <Row
                                gutter={[16, 16]}
                                style={{ marginBottom: 16 }}
                                justify={'center'}
                            >
                                <Col span={5}>
                                    {self.createProjectTreeView()}
                                </Col>
                                <Col span={19} style={{ maxWidth: 1200 }}>
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
                                                              .selectedRowKeys,
                                                      onChange: (
                                                          newSelectedRowKeys: React.Key[]
                                                      ) => {
                                                          self.setState({
                                                              selectedRowKeys:
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

                                    {self.createProjectTiles()}
                                </Col>
                            </Row>
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

        const description = selectedProject.description
        return (
            <Card style={{ marginTop: 24 }}>
                <span
                    style={{
                        position: 'absolute',
                        paddingRight: 8,
                        paddingLeft: 8,
                        paddingBottom: 0,
                        marginTop: -36,
                        marginLeft: -15,
                    }}
                >
                    <h4 style={{ margin: 0 }}>Notes</h4>
                </span>
                <div
                    style={{
                        whiteSpace: 'pre-wrap',
                    }}
                >
                    {description}
                </div>
            </Card>
        )
    }

    createProjectTiles(): React.ReactNode {
        const self = this
        const selectedProjectId =
            self.state.selectedProjectId === ROOT_APPS
                ? ''
                : self.state.selectedProjectId

        if (selectedProjectId === ALL_APPS) return <div />

        const childProjects: ProjectDefinition[] = []
        self.props.projects.forEach((item) => {
            if (
                (!item.parentProjectId && !selectedProjectId) ||
                selectedProjectId === item.parentProjectId
            ) {
                childProjects.push(item)
            }
        })

        if (childProjects.length === 0) return <div />

        return (
            <div style={{ marginTop: 60 }}>
                <h3>Projects:</h3>
                <Row gutter={16}>
                    {childProjects.map((p) => self.createProjectTile(p))}
                </Row>
            </div>
        )
    }

    createProjectTile(p: ProjectDefinition): any {
        return (
            <Card style={{ marginRight: 0, marginLeft: 25 }}>
                <ClickableLink
                    onLinkClicked={() => {
                        //
                    }}
                >
                    <h4>{p.name}</h4>
                </ClickableLink>
            </Card>
        )
    }

    createAppTableHeader(): React.ReactNode {
        const self = this
        let projectName = ''

        let editable = false

        if (this.state.selectedProjectId === ALL_APPS) {
            projectName = 'All'
        } else if (this.state.selectedProjectId === ROOT_APPS) {
            projectName = 'Root'
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

            projectName = breadCrumbs
                .map((id) => projectsMap[id]?.name || '')
                .join(' > ')
        }

        const className = 'edit-icon-' + self.state.selectedProjectId

        if (!editable) {
            return <h3>{projectName}</h3>
        } else {
            const editProjectClicked = function () {
                self.props.history.push(
                    '/apps/projects/' + self.state.selectedProjectId
                )
            }

            return (
                <h3
                    style={{
                        position: 'relative',
                        display: 'inline-block',
                        cursor: 'pointer',
                        paddingRight: 20,
                    }}
                    onClick={editProjectClicked}
                    onMouseEnter={(e) => {
                        const editIcon = e.currentTarget.querySelector(
                            '.' + className
                        ) as HTMLElement
                        if (editIcon) editIcon.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                        const editIcon = e.currentTarget.querySelector(
                            '.' + className
                        ) as HTMLElement
                        if (editIcon) editIcon.style.opacity = '0'
                    }}
                >
                    {projectName}
                    <span
                        className={className}
                        style={{
                            marginLeft: 10,
                            opacity: 0,
                            transition: 'opacity 0.3s',
                        }}
                    >
                        <ClickableLink onLinkClicked={editProjectClicked}>
                            <EditOutlined />
                        </ClickableLink>
                    </span>
                </h3>
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
            //       "title": "atest",
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
            //         "title": "atest",
            //         "key": "ba0d06ae-d114-4094-a8d3-4bb91d9004bb"
            //       }
            //     ],
            //     "nativeEvent": {
            //       "isTrusted": true
            //     }
        }

        const onCheck: TreeProps['onCheck'] = (checkedKeys, info) => {
            // console.log('onCheck', checkedKeys, info)
            // TODO!
        }

        return (
            <Card style={{ height: '100%' }}>
                <Tree.DirectoryTree
                    style={{ marginLeft: -22 }}
                    showLine
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
