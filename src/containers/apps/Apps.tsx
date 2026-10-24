import { Col, Row } from 'antd'
import { RouteComponentProps } from 'react-router'
import ProjectDefinition from '../../models/ProjectDefinition'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import { IAppDef } from './AppDefinition'
import AppsTable from './AppsTable'

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
        isCreatingApp: boolean
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: true,
            apiData: undefined,
            isCreatingApp: false,
        }
    }

    onCreateNewAppClicked(
        appName: string,
        projectId: string,
        hasPersistentData: boolean
    ) {
        const self = this

        if (self.state.isCreatingApp) return
        self.setState({ isCreatingApp: true })

        Promise.resolve() //
            .then(function () {
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
                self.setState({ isCreatingApp: false })
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

        return (
            <div className="slow-fadein-fast">
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
                                projects={apiData.projects}
                                rootDomain={apiData.apps.rootDomain}
                                isCreatingApp={self.state.isCreatingApp}
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
                            />
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }

    componentDidMount() {
        this.reFetchData()
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
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }
}
