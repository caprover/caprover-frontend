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
import { localize } from '../../utils/Language'
import Logger from '../../utils/Logger'
import NewTabLink from '../global/NewTabLink'
import Timestamp from '../global/Timestamp'
import { IAppDef } from './AppDefinition'
import onDeleteAppClicked from './DeleteAppConfirm'

type TableData = IAppDef & { lastDeployTime: string }

class AppsTable extends Component<
    {
        history: History
        apps: IAppDef[]
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
    }
> {
    constructor(props: any) {
        super(props)
        const urlsQuery = new URLSearchParams(props.search || '').get('q') || ''
        this.state = {
            searchTerm: urlsQuery,
            isBulkEditMode: false,
            selectedRowKeys: [],
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
                align: ALIGN,
            },
            {
                title: localize('apps_table.tags', 'Tags'),
                dataIndex: 'tags',
                key: 'tags',
                align: ALIGN,
                width: '18%',
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
                                                  self.state.selectedRowKeys,
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
