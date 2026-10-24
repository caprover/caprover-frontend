import { Col, Row } from 'antd'
import { CapRoverModels } from 'caprover-api'
import { RouteComponentProps } from 'react-router'
import ProjectDefinition from '../../models/ProjectDefinition'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import { IAppDef } from './AppDefinition'
import AppsTable from './AppsTable'
import CreateNewApp from './CreateNewApp'

export default class Apps extends ApiComponent<
    RouteComponentProps<any>,
    {
        isLoading: boolean
        apiData:
            | {
                  apps: {
                      appDefinitions: IAppDef[]
                      defaultNginxConfig: string
                      rootDomain: string
                  }
                  projects: ProjectDefinition[]
              }
            | undefined
        showCreateAppForm: boolean
        appsRuntimeData: CapRoverModels.AppsRuntimeResponse | undefined
        isRuntimeLoading: boolean
        runtimeRefreshFailed: boolean
    }
> {
    private updateRuntimeInterval: any
    private runtimeRequestId = 0
    private runtimeRequestInProgress = false
    private runtimeRefreshQueued = false

    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: true,
            apiData: undefined,
            showCreateAppForm: false,
            appsRuntimeData: undefined,
            isRuntimeLoading: true,
            runtimeRefreshFailed: false,
        }
    }

    onCreateNewAppClicked(
        appName: string,
        projectId: string,
        hasPersistentData: boolean
    ) {
        const self = this

        Promise.resolve() //
            .then(function () {
                self.setState({ isLoading: true })
                return self.apiManager.registerNewApp(
                    appName,
                    projectId,
                    hasPersistentData,
                    true
                )
            })
            .then(function () {
                return self.reFetchData()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    render() {
        const self = this

        if (self.state.isLoading) {
            return <CenteredSpinner />
        }

        const apiData = self.state.apiData

        if (!apiData) {
            return <ErrorRetry />
        }

        const showAppsTable: boolean =
            apiData.apps.appDefinitions.length > 0 ||
            apiData.projects.length > 0

        const showCreateAppForm: boolean =
            self.state.showCreateAppForm || !showAppsTable

        return (
            <div className="slow-fadein-fast">
                {showCreateAppForm && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 25,
                            padding: '0 20px',
                            margin: '0 auto 50px',
                            maxWidth: 1000,
                        }}
                    >
                        <Row justify="center">
                            <Col
                                xs={{
                                    span: 24,
                                }}
                                lg={{
                                    span: 24,
                                }}
                            >
                                <CreateNewApp
                                    projects={apiData.projects}
                                    onCreateNewAppClicked={(
                                        appName: string,
                                        projectId: string,
                                        hasPersistency: boolean
                                    ) => {
                                        self.onCreateNewAppClicked(
                                            appName,
                                            projectId,
                                            hasPersistency
                                        )
                                    }}
                                    onOneClickAppClicked={() => {
                                        self.props.history.push(
                                            '/apps/oneclick'
                                        )
                                    }}
                                    onDockerComposeClicked={() => {
                                        self.props.history.push(
                                            '/apps/dockercompose'
                                        )
                                    }}
                                />
                            </Col>
                        </Row>
                    </div>
                )}
                {showAppsTable && (
                    <div
                        style={{
                            padding: '0 20px',
                            margin: '0 auto 50px',
                        }}
                    >
                        <Row justify="center">
                            <Col lg={{ span: 24 }}>
                                <AppsTable
                                    onReloadRequested={() => {
                                        self.reFetchData()
                                    }}
                                    search={self.props.location.search}
                                    history={self.props.history}
                                    apiManager={self.apiManager}
                                    defaultNginxConfig={
                                        apiData.apps.defaultNginxConfig
                                    }
                                    apps={apiData.apps.appDefinitions}
                                    appsRuntimeData={self.state.appsRuntimeData}
                                    isRuntimeLoading={
                                        self.state.isRuntimeLoading
                                    }
                                    runtimeRefreshFailed={
                                        self.state.runtimeRefreshFailed
                                    }
                                    projects={apiData.projects}
                                    rootDomain={apiData.apps.rootDomain}
                                    showCreateAppForm={showCreateAppForm}
                                    onToggleCreateAppVisibility={() => {
                                        self.setState({
                                            showCreateAppForm:
                                                !self.state.showCreateAppForm,
                                        })
                                    }}
                                />
                            </Col>
                        </Row>
                    </div>
                )}
            </div>
        )
    }

    componentDidMount() {
        this.reFetchData()
        const self = this
        this.updateRuntimeInterval = setInterval(function () {
            self.refreshRuntime()
        }, 20000)
    }

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) super.componentWillUnmount()
        this.runtimeRequestId++
        this.runtimeRefreshQueued = false
        if (this.updateRuntimeInterval) {
            clearInterval(this.updateRuntimeInterval)
        }
    }

    reFetchData() {
        const self = this
        self.setState({ isLoading: true })
        return Promise.all([
            self.apiManager.getAllApps(),
            self.apiManager.getAllProjects(),
        ])
            .then(function (data: any) {
                self.setState({
                    apiData: { apps: data[0], projects: data[1].projects },
                })
                self.refreshRuntime()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    refreshRuntime(): Promise<void> {
        const self = this
        if (self.runtimeRequestInProgress) {
            self.runtimeRefreshQueued = true
            return Promise.resolve()
        }

        self.runtimeRequestInProgress = true
        const requestId = ++self.runtimeRequestId
        self.setState({ isRuntimeLoading: !self.state.appsRuntimeData })

        return self.apiManager
            .getAppsRuntime()
            .then(function (appsRuntimeData) {
                if (
                    !self.willUnmountSoon &&
                    requestId === self.runtimeRequestId
                ) {
                    self.setState({
                        appsRuntimeData,
                        runtimeRefreshFailed: false,
                    })
                }
            })
            .catch(function () {
                if (
                    !self.willUnmountSoon &&
                    requestId === self.runtimeRequestId
                ) {
                    self.setState({ runtimeRefreshFailed: true })
                }
            })
            .then(function () {
                self.runtimeRequestInProgress = false
                if (
                    !self.willUnmountSoon &&
                    requestId === self.runtimeRequestId
                ) {
                    self.setState({ isRuntimeLoading: false })
                }

                if (self.runtimeRefreshQueued && !self.willUnmountSoon) {
                    self.runtimeRefreshQueued = false
                    return self.refreshRuntime()
                }
            })
    }
}
