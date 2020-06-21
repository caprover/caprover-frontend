import { Button, Col, Icon, Layout, Menu, Row } from 'antd'
import { SelectParam } from 'antd/lib/menu'
import React, { Fragment, RefObject } from 'react'
import { connect } from 'react-redux'
import { Route, RouteComponentProps, Switch } from 'react-router'
import ApiManager from '../api/ApiManager'
import { IVersionInfo } from '../models/IVersionInfo'
import * as GlobalActions from '../redux/actions/GlobalActions'
import AppDetails from './apps/appDetails/AppDetails'
import Apps from './apps/Apps'
import OneClickAppSelector from './apps/oneclick/selector/OneClickAppSelector'
import OneClickAppConfigPage from './apps/oneclick/variables/OneClickAppConfigPage'
import Dashboard from './Dashboard'
import ApiComponent from './global/ApiComponent'
import ClickableLink from './global/ClickableLink'
import NewTabLink from './global/NewTabLink'
import LoggedInCatchAll from './LoggedInCatchAll'
import Monitoring from './monitoring/Monitoring'
import Cluster from './nodes/Cluster'
import Settings from './settings/Settings'

const { Header, Content, Sider } = Layout

const MENU_ITEMS = [
    {
        key: 'dashboard',
        name: 'Dashboard',
        icon: 'laptop',
    },
    {
        key: 'apps',
        name: 'Apps',
        icon: 'code',
    },
    {
        key: 'monitoring',
        name: 'Monitoring',
        icon: 'dashboard',
    },
    {
        key: 'cluster',
        name: 'Cluster',
        icon: 'cluster',
    },
    {
        key: 'settings',
        name: 'Settings',
        icon: 'setting',
    },
]

interface RootPageInterface extends RouteComponentProps<any> {
    rootElementKey: string
    emitSizeChanged: () => void
    isMobile: boolean
}

class PageRoot extends ApiComponent<
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
        this.state = {
            versionInfo: undefined,
            collapsed: false,
        }
    }

    updateDimensions = () => this.props.emitSizeChanged()

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) super.componentWillUnmount()
        this.updateDimensions()
        window.removeEventListener('resize', this.updateDimensions)
    }

    componentDidUpdate(prevProps: any) {
        // Typical usage (don't forget to compare props):
        if (
            this.props.location.pathname !== prevProps.location.pathname &&
            this.props.isMobile
        ) {
            this.setState({ collapsed: true })
        }
    }

    componentDidMount() {
        const self = this
        this.updateDimensions()

        window.addEventListener('resize', this.updateDimensions)

        if (!ApiManager.isLoggedIn()) {
            this.goToLogin()
        } else {
            this.apiManager
                .getVersionInfo()
                .then(function (data) {
                    self.setState({ versionInfo: data })
                })
                .catch((err) => {
                    // ignore error
                })
        }
    }

    goToLogin() {
        this.props.history.push('/login')
    }

    createUpdateAvailableIfNeeded() {
        const self = this

        if (!self.state.versionInfo || !self.state.versionInfo.canUpdate) {
            return undefined
        }

        return (
            <Fragment>
                <ClickableLink
                    onLinkClicked={() => self.props.history.push('/settings')}
                >
                    <Icon
                        type="gift"
                        theme="twoTone"
                        style={{
                            marginLeft: 50,
                        }}
                    />
                    <Icon
                        type="gift"
                        theme="twoTone"
                        style={{
                            marginRight: 10,
                            marginLeft: 3,
                        }}
                    />
                    Update Available!
                    <Icon
                        type="gift"
                        theme="twoTone"
                        style={{
                            marginLeft: 10,
                        }}
                    />
                    <Icon
                        type="gift"
                        theme="twoTone"
                        style={{
                            marginLeft: 3,
                        }}
                    />
                </ClickableLink>
            </Fragment>
        )
    }

    onSelectMenu(param: SelectParam) {
        this.props.history.push('/' + param.key)
    }

    toggleSider = () => {
        this.setState({ collapsed: !this.state.collapsed })
    }

    render() {
        const self = this
        return (
            <Layout className="full-screen-bg">
                <Header
                    className="header"
                    style={{
                        padding: `0 ${this.props.isMobile ? 15 : 50}px`,
                    }}
                >
                    <div>
                        <Row>
                            {this.props.isMobile && (
                                <Col span={4}>
                                    <Button
                                        ghost
                                        icon="bars"
                                        onClick={this.toggleSider}
                                    />
                                </Col>
                            )}
                            {(this.props.isMobile &&
                                self.createUpdateAvailableIfNeeded()) || (
                                <Col lg={{ span: 12 }} xs={{ span: 20 }}>
                                    <div>
                                        <h3 style={{ color: '#fff' }}>
                                            <img
                                                alt="logo"
                                                src="/icon-512x512.png"
                                                style={{
                                                    height: 45,
                                                    marginRight: 10,
                                                }}
                                            />
                                            CapRover
                                            {self.createUpdateAvailableIfNeeded()}
                                        </h3>
                                    </div>
                                </Col>
                            )}
                            {!self.props.isMobile && (
                                <Col span={12}>
                                    <Row type="flex" justify="end">
                                        <NewTabLink url="https://github.com/caprover/caprover">
                                            <span style={{ marginRight: 20 }}>
                                                GitHub
                                            </span>
                                        </NewTabLink>

                                        <span
                                            style={{
                                                marginRight: 70,
                                            }}
                                        >
                                            <NewTabLink url="https://caprover.com">
                                                Docs
                                            </NewTabLink>
                                        </span>
                                        <span>
                                            <span
                                                style={{
                                                    border: '1px solid #1b8ad3',
                                                    borderRadius: 5,
                                                    padding: 8,
                                                }}
                                            >
                                                <ClickableLink
                                                    onLinkClicked={() => {
                                                        self.apiManager.setAuthToken(
                                                            ''
                                                        )
                                                        self.goToLogin()
                                                    }}
                                                >
                                                    Logout{' '}
                                                    <Icon type="logout" />
                                                </ClickableLink>
                                            </span>
                                        </span>
                                    </Row>
                                </Col>
                            )}
                        </Row>
                    </div>
                </Header>

                <Layout>
                    <Sider
                        breakpoint="lg"
                        trigger={this.props.isMobile && undefined}
                        collapsible
                        collapsed={this.state.collapsed}
                        width={200}
                        collapsedWidth={self.props.isMobile ? 0 : 80}
                        style={{ zIndex: 2 }}
                        onCollapse={this.toggleSider}
                    >
                        <Menu
                            selectedKeys={[
                                this.props.location.pathname.substring(1),
                            ]}
                            onSelect={(param: SelectParam) => {
                                this.onSelectMenu(param)
                            }}
                            theme="dark"
                            mode="inline"
                            defaultSelectedKeys={['dashboard']}
                            style={{ height: '100%', borderRight: 0 }}
                        >
                            {MENU_ITEMS.map((item) => (
                                <Menu.Item key={item.key}>
                                    <span>
                                        <Icon type={item.icon} />
                                        <span>{item.name}</span>
                                    </span>
                                </Menu.Item>
                            ))}

                            {this.props.isMobile && (
                                <Fragment>
                                    <div
                                        style={{
                                            backgroundColor:
                                                'rgba(255, 255, 255, 0.65)',
                                            height: 1,
                                            width: '80%',
                                            margin: '15px auto',
                                        }}
                                    />
                                    <div
                                        className="ant-menu-item"
                                        role="menuitem"
                                        style={{ paddingLeft: 24 }}
                                    >
                                        <NewTabLink url="https://github.com/caprover/caprover">
                                            <Icon type="github" />
                                            GitHub
                                        </NewTabLink>
                                    </div>

                                    <div
                                        className="ant-menu-item"
                                        role="menuitem"
                                        style={{ paddingLeft: 24 }}
                                    >
                                        <NewTabLink url="https://caprover.com">
                                            <Icon type="file-text" />
                                            Docs
                                        </NewTabLink>
                                    </div>

                                    <div
                                        className="ant-menu-item"
                                        role="menuitem"
                                        style={{ paddingLeft: 24 }}
                                    >
                                        <ClickableLink
                                            onLinkClicked={() => {
                                                this.apiManager.setAuthToken('')
                                                this.goToLogin()
                                            }}
                                        >
                                            {' '}
                                            <Icon type="logout" />
                                            Logout
                                        </ClickableLink>
                                    </div>
                                </Fragment>
                            )}
                        </Menu>
                    </Sider>
                    <Content>
                        <div
                            key={self.props.rootElementKey}
                            ref={self.mainContainer}
                            style={{
                                paddingTop: 12,
                                paddingBottom: 36,
                                height: '100%',
                                overflowY: 'scroll',
                                marginRight: self.state.collapsed
                                    ? 0
                                    : self.props.isMobile
                                    ? -200
                                    : 0,
                                transition: 'margin-right 0.3s ease',
                            }}
                            id="main-content-layout"
                        >
                            <Switch>
                                <Route
                                    path="/dashboard/"
                                    component={Dashboard}
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
                                    path="/apps/oneclick/:appName"
                                    component={OneClickAppConfigPage}
                                />
                                <Route
                                    path="/apps/oneclick"
                                    component={OneClickAppSelector}
                                />
                                <Route path="/apps/" component={Apps} />
                                <Route
                                    path="/monitoring/"
                                    component={Monitoring}
                                />
                                <Route path="/cluster/" component={Cluster} />
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
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect(mapStateToProps, {
    emitSizeChanged: GlobalActions.emitSizeChanged,
})(PageRoot)
