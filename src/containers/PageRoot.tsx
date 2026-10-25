import { Button, Layout } from 'antd'
import { PanelLeft } from 'lucide-react'
import React, { RefObject } from 'react'
import { connect } from 'react-redux'
import { Route, RouteComponentProps, Switch } from 'react-router'
import ApiManager from '../api/ApiManager'
import { IVersionInfo } from '../models/IVersionInfo'
import { SetupStatus } from '../models/SetupStatus'
import { refreshSetup } from '../redux/actions/SetupActions'
import * as GlobalActions from '../redux/actions/GlobalActions'
import { localize } from '../utils/Language'
import StorageHelper from '../utils/StorageHelper'
import Utils from '../utils/Utils'
import Dashboard from './Dashboard'
import LoggedInCatchAll from './LoggedInCatchAll'
import Sidebar from './Sidebar'
import Setup from './Setup'
import Apps from './apps/Apps'
import ProjectDetailsEdit from './apps/ProjectDetailsEdit'
import AppDetails from './apps/appDetails/AppDetails'
import DockerComposeEntry from './apps/compose/DockerComposeEntry'
import OneClickAppSelector from './apps/oneclick/selector/OneClickAppSelector'
import TemplateInputPage from './apps/oneclick/template/TemplateInputPage'
import OneClickAppConfigPage from './apps/oneclick/variables/OneClickAppConfigPage'
import OneClickDeploymentPage from './apps/oneclick/variables/OneClickDeploymentPage'
import ApiComponent from './global/ApiComponent'
import Maintenance from './maintenance/Maintenance'
import DiskUsageAlertContainer from './monitoring/DiskUsageAlertContainer'
import Monitoring from './monitoring/Monitoring'
import Cluster from './nodes/Cluster'
import Overview from './overview/Overview'
import Settings from './settings/Settings'

const { Header, Content } = Layout

interface RootPageInterface extends RouteComponentProps<any> {
    rootElementKey: string
    setupStatus: SetupStatus
    setupDismissed: boolean
    refreshSetup: () => void
    emitSizeChanged: () => void
    isMobile: boolean
}

export class PageRoot extends ApiComponent<
    RootPageInterface,
    {
        versionInfo: IVersionInfo | undefined
        collapsed: boolean
    }
> {
    private mainContainer: RefObject<HTMLDivElement>

    constructor(props: any) {
        super(props)
        this.mainContainer = React.createRef()
        this.state = { versionInfo: undefined, collapsed: Utils.isMobile() }
    }

    updateDimensions = () => this.props.emitSizeChanged()

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) super.componentWillUnmount()
        window.removeEventListener('resize', this.updateDimensions)
    }

    componentDidUpdate(prevProps: RootPageInterface) {
        if (
            this.props.isMobile &&
            (!prevProps.isMobile ||
                this.props.location.pathname !== prevProps.location.pathname)
        ) {
            this.setState({ collapsed: true })
        } else if (prevProps.isMobile && !this.props.isMobile) {
            this.setState({
                collapsed:
                    StorageHelper.getSiderCollapsedStateFromLocalStorage(),
            })
        }
    }

    componentDidMount() {
        const self = this
        this.updateDimensions()
        window.addEventListener('resize', this.updateDimensions)
        if (!ApiManager.isLoggedIn()) {
            this.goToLogin()
        } else {
            this.props.refreshSetup()
            this.apiManager
                .getVersionInfo()
                .then(function (data) {
                    self.setState({ versionInfo: data })
                })
                .catch(() => {
                    /* Version checks do not block navigation. */
                })
            this.setState({
                collapsed:
                    Utils.isMobile() ||
                    StorageHelper.getSiderCollapsedStateFromLocalStorage(),
            })
        }
    }

    goToLogin() {
        this.props.history.push('/login')
    }

    toggleSider = () => {
        if (!this.props.isMobile) {
            StorageHelper.setSiderCollapsedStateInLocalStorage(
                !this.state.collapsed
            )
        }
        this.setState({ collapsed: !this.state.collapsed })
    }

    render() {
        const self = this
        const section = this.props.location.pathname.split('/')[1]
        const titles: { [key: string]: string } = {
            overview: localize('menu_item.overview', 'Overview'),
            setup: localize('menu_item.setup', 'Setup'),
            apps: localize('menu_item.app', 'Apps'),
            monitoring: localize('menu_item.monitoring', 'Monitoring'),
            cluster: localize('menu_item.infrastructure', 'Infrastructure'),
            maintenance: localize('menu_item.maintenance', 'Maintenance'),
            settings: localize('menu_item.settings', 'Settings'),
        }
        return (
            <Layout
                className="full-screen app-shell"
                key={self.props.rootElementKey}
            >
                <Sidebar
                    showSetup={
                        !this.props.setupDismissed &&
                        this.props.setupStatus !== SetupStatus.Complete
                    }
                    isMobile={this.props.isMobile}
                    collapsed={this.state.collapsed}
                    toggleSider={this.toggleSider}
                    location={this.props.location}
                    history={this.props.history}
                    onLogoutClicked={() => {
                        ApiManager.clearAuthKeys()
                        self.goToLogin()
                    }}
                />
                <Layout className="workspace-layout">
                    <Header className="workspace-header">
                        <div className="workspace-breadcrumb">
                            <Button
                                type="text"
                                icon={<PanelLeft size={16} />}
                                onClick={this.toggleSider}
                                aria-label={localize(
                                    'navigation.toggle',
                                    'Toggle navigation'
                                )}
                            />
                            <span className="header-separator" />
                            <span>{titles[section] || 'CapRover'}</span>
                        </div>
                        {self.state.versionInfo?.canUpdate && (
                            <Button
                                className="update-available-button"
                                type="primary"
                                size="small"
                                icon={<span aria-hidden="true">🚀</span>}
                                onClick={() =>
                                    self.props.history.push('/maintenance')
                                }
                            >
                                {localize(
                                    'navigation.update_available',
                                    'Update available'
                                )}
                            </Button>
                        )}
                    </Header>
                    <Content className="workspace-content">
                        <DiskUsageAlertContainer history={self.props.history} />
                        <div ref={self.mainContainer} id="main-content-layout">
                            <Switch>
                                <Route path="/overview/" component={Overview} />
                                <Route path="/setup/" component={Setup} />
                                <Route
                                    path="/dashboard/"
                                    component={Dashboard}
                                />

                                <Route
                                    path="/apps/projects/new"
                                    render={(props) => (
                                        <ProjectDetailsEdit
                                            {...props}
                                            createNewProject={true}
                                            mainContainer={self.mainContainer}
                                        />
                                    )}
                                />

                                <Route
                                    path="/apps/projects/:projectId"
                                    render={(props) => (
                                        <ProjectDetailsEdit
                                            {...props}
                                            createNewProject={false}
                                            mainContainer={self.mainContainer}
                                        />
                                    )}
                                />
                                <Route
                                    path="/apps/details/:appName"
                                    render={(props) => (
                                        <AppDetails
                                            {...props}
                                            mainContainer={self.mainContainer}
                                        />
                                    )}
                                />
                                <Route
                                    path={`/apps/oneclick/templategenerator`}
                                    component={TemplateInputPage}
                                />
                                <Route
                                    path="/apps/oneclick/deployment"
                                    component={OneClickDeploymentPage}
                                />
                                <Route
                                    path="/apps/oneclick/:appName"
                                    component={OneClickAppConfigPage}
                                />
                                <Route
                                    path="/apps/oneclick"
                                    component={OneClickAppSelector}
                                />
                                <Route
                                    path="/apps/dockercompose"
                                    component={DockerComposeEntry}
                                />
                                <Route path="/apps/" component={Apps} />
                                <Route
                                    path="/monitoring/"
                                    component={Monitoring}
                                />
                                <Route path="/cluster/" component={Cluster} />
                                <Route
                                    path="/maintenance/"
                                    component={Maintenance}
                                />
                                <Route path="/settings/" component={Settings} />
                                <Route path="/" component={LoggedInCatchAll} />
                            </Switch>
                        </div>
                    </Content>
                </Layout>
            </Layout>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        rootElementKey: state.globalReducer.rootElementKey,
        setupStatus: state.globalReducer.setupStatus,
        setupDismissed: state.globalReducer.setupDismissed,
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect(mapStateToProps, {
    emitSizeChanged: GlobalActions.emitSizeChanged,
    refreshSetup,
})(PageRoot)
