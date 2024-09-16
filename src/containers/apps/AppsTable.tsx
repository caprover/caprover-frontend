import {
    CheckOutlined,
    CodeOutlined,
    DeleteOutlined,
    DisconnectOutlined,
    LinkOutlined,
    LoadingOutlined,
    UnorderedListOutlined,
} from '@ant-design/icons'
import { Button, Card, Input, Row, Table, Tag, Tooltip } from 'antd'
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
import NewTabLink from '../global/NewTabLink'
import Timestamp from '../global/Timestamp'
import { IAppDef } from './AppDefinition'
import onDeleteAppClicked from './DeleteAppConfirm'

type TableData =
    | (IAppDef & {
          lastDeployTime: string
          isProject: false
          key: React.Key
          children: TableData[] | undefined
      })
    | {
          isProject: true
          projectDetail: ProjectDefinition
          key: React.Key
          children: TableData[] | undefined
      }

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
        expandedRowKeys: React.Key[]
    }
> {
    constructor(props: any) {
        super(props)
        const urlsQuery = new URLSearchParams(props.search || '').get('q') || ''
        this.state = {
            searchTerm: urlsQuery,
            isBulkEditMode: false,
            selectedRowKeys: [],
            expandedRowKeys: [],
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
                render: (_: any, rowData: TableData) => {
                    if (rowData.isProject) {
                        return (
                            <span>
                                <b>{rowData.projectDetail.name}</b>
                            </span>
                        )
                    }
                    return (
                        <Link to={this.appDetailPath(rowData.appName || 'app')}>
                            {rowData.appName || 'app'}
                        </Link>
                    )
                },
                sorter: (a, b) => {
                    if (a.isProject || b.isProject) {
                        // TODO
                        return 0
                    }
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
                    if (app.isProject) {
                        return <span></span>
                    }

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
                    if (a.isProject || b.isProject) {
                        // TODO
                        return 0
                    }

                    return (
                        Date.parse(a.lastDeployTime) -
                        Date.parse(b.lastDeployTime)
                    )
                },
                sortDirections: ['descend', 'ascend'],
                render: (lastDeployTime: string, app) => {
                    if (app.isProject) {
                        // TODO
                        return <span />
                    }

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
                    if (app.isProject) {
                        // TODO
                        return <span />
                    }

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

    organizeItems(items: TableData[]): TableData[] {
        const projectsMap: { [key: string]: TableData } = {}
        let root: TableData[] = []

        // Create a map of all projects
        items.forEach((item) => {
            if (item.isProject) {
                projectsMap[item.projectDetail.id] = {
                    ...item,
                } as TableData
            }
        })

        // Distribute projects and apps to their respective parents or to the root
        items.forEach((item) => {
            if (item.isProject) {
                const project = projectsMap[item.projectDetail.id]
                if (
                    item.projectDetail.parentProjectId &&
                    projectsMap[item.projectDetail.parentProjectId]
                ) {
                    const children =
                        projectsMap[item.projectDetail.parentProjectId]
                            .children || []

                    children.push(project)
                    projectsMap[item.projectDetail.parentProjectId].children =
                        children
                } else {
                    root.push(project)
                }
            } else {
                const app = item
                if (app.projectId && projectsMap[app.projectId]) {
                    const children = projectsMap[app.projectId].children || []

                    children.push(app)
                    projectsMap[app.projectId].children = children
                } else {
                    root.push(app)
                }
            }
        })

        root.forEach((project) => {
            if (project.children)
                project.children =
                    project.children.length > 0 ? project.children : undefined
        })

        function sortByName(original: TableData[]): TableData[] {
            return original
                .sort((a, b) => {
                    // First, sort by isProject, descending: true values come first
                    if (a.isProject && !b.isProject) return -1
                    if (!a.isProject && b.isProject) return 1

                    const aName = a.isProject ? a.projectDetail.name : a.appName
                    const bName = b.isProject ? b.projectDetail.name : b.appName
                    return (aName || '').localeCompare(bName || '')
                })
                .map((item) => {
                    if (item.isProject && item.children) {
                        return { ...item, children: sortByName(item.children) }
                    }
                    return item
                })
        }

        root = sortByName(root)

        return root
    }

    render() {
        const self = this

        const dataToRender: TableData[] = self.props.apps
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

                return {
                    ...app,
                    lastDeployTime,
                    key: 'app-' + app.appName,
                    isProject: false,
                    children: undefined,
                }
            })

        // Push all projects to dataToRender
        self.props.projects.forEach((project) => {
            dataToRender.push({
                isProject: true,
                projectDetail: project,
                key: 'project-' + project.id,
                children: undefined,
            })
        })

        const expandedRowKeys = self.state.searchTerm
            ? dataToRender
                  .filter((app) => app.isProject)
                  .map((project) => project.key)
            : self.state.expandedRowKeys

        const organizedData = self.organizeItems(dataToRender)

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
                                                // with or without errors, let's refresh the page...
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
                        dataToRender
                            .filter((app) => !app.isProject)
                            .map((app: any) => ({
                                ...app,
                            }))
                            .map(
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
                                            <Link
                                                to={this.appDetailPath(appName)}
                                            >
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
                            <Table<TableData>
                                expandable={{
                                    expandedRowKeys: expandedRowKeys,
                                    onExpandedRowsChange: (expandedRows) => {
                                        self.setState({
                                            expandedRowKeys: [...expandedRows],
                                        })
                                    },
                                }}
                                columns={self.createColumns()}
                                dataSource={organizedData}
                                pagination={false}
                                size="middle"
                                rowSelection={
                                    self.state.isBulkEditMode
                                        ? {
                                              selectedRowKeys:
                                                  self.state.selectedRowKeys,
                                              onChange: (
                                                  selectedRowKeys,
                                                  selectedRows
                                              ) => {
                                                  self.setState({
                                                      selectedRowKeys:
                                                          selectedRowKeys,
                                                  })
                                              },
                                              checkStrictly: false,
                                          }
                                        : undefined
                                }
                                onChange={(pagination, filters, sorter) => {
                                    // Persist sorter state
                                    if (!Array.isArray(sorter)) {
                                        window.localStorage.appsSortKey =
                                            sorter.columnKey
                                        window.localStorage.appsSortOrder =
                                            sorter.order
                                    }
                                }}
                            />
                        </div>
                    )}
                </Row>
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
