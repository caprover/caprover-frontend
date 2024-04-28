import {
    CloseOutlined,
    DeleteOutlined,
    EditOutlined,
    ReadOutlined,
    SaveOutlined,
} from '@ant-design/icons'
import {
    Affix,
    Alert,
    Button,
    Card,
    Col,
    Input,
    Modal,
    Popover,
    Row,
    Tabs,
    Tooltip,
} from 'antd'
import classnames from 'classnames'
import { RefObject } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import ApiManager from '../../../api/ApiManager'
import { IMobileComponent } from '../../../models/ContainerProps'
import { IHashMapGeneric } from '../../../models/IHashMapGeneric'
import Toaster from '../../../utils/Toaster'
import Utils from '../../../utils/Utils'
import ApiComponent from '../../global/ApiComponent'
import CenteredSpinner from '../../global/CenteredSpinner'
import ClickableLink from '../../global/ClickableLink'
import ErrorRetry from '../../global/ErrorRetry'
import { IAppDef } from '../AppDefinition'
import onDeleteAppClicked from '../DeleteAppConfirm'
import AppConfigs from './AppConfigs'
import HttpSettings from './HttpSettings'
import Deployment from './deploy/Deployment'

const WEB_SETTINGS = 'WEB_SETTINGS'
const APP_CONFIGS = 'APP_CONFIGS'
const DEPLOYMENT = 'DEPLOYMENT'

export interface SingleAppApiData {
    appDefinition: IAppDef
    rootDomain: string
    captainSubDomain: string
    defaultNginxConfig: string
}

export interface AppDetailsTabProps {
    apiData: SingleAppApiData
    apiManager: ApiManager
    updateApiData: Function
    onUpdateConfigAndSave: () => void
    reFetchData: () => void
    setLoading: (value: boolean) => void
    isMobile: boolean
}

interface PropsInterface extends RouteComponentProps<any> {
    mainContainer: RefObject<HTMLDivElement>
    isMobile: boolean
}

class AppDetails extends ApiComponent<
    PropsInterface,
    {
        isLoading: boolean
        apiData: SingleAppApiData | undefined
        activeTabKey: string
        renderCounterForAffixBug: number
    }
> {
    private reRenderTriggered = false
    private confirmedAppNameToDelete: string = ''
    private volumesToDelete: IHashMapGeneric<boolean> = {}

    constructor(props: any) {
        super(props)

        this.state = {
            activeTabKey: WEB_SETTINGS,
            isLoading: true,
            renderCounterForAffixBug: 0,
            apiData: undefined,
        }
    }

    goBackToApps() {
        this.props.history.push('/apps')
    }

    openRenameAppDialog() {
        const self = this
        const app = self.state.apiData!.appDefinition
        const tempVal = { newName: app.appName }
        Modal.confirm({
            title: 'Rename the app:',
            content: (
                <div>
                    <Alert
                        type="warning"
                        message="If other apps use the current name to communicate with this app, make sure to update them as well to avoid problems."
                    />
                    <Input
                        style={{ marginTop: 15 }}
                        placeholder="app-name-here"
                        defaultValue={app.appName}
                        onChange={(e) => {
                            tempVal.newName = (e.target.value || '').trim()
                        }}
                    />
                </div>
            ),
            onOk() {
                const changed = app.appName !== tempVal.newName
                if (changed && tempVal.newName)
                    self.renameAppTo(tempVal.newName)
            },
        })
    }

    viewDescription() {
        const self = this
        const app = self.state.apiData!.appDefinition
        const tempVal = { tempDescription: app.description }
        Modal.confirm({
            title: 'App Description:',
            content: (
                <div>
                    <Input.TextArea
                        style={{ marginTop: 15 }}
                        placeholder="Use app description to take some notes for your app"
                        rows={12}
                        defaultValue={app.description}
                        onChange={(e) => {
                            tempVal.tempDescription = e.target.value
                        }}
                    />
                </div>
            ),
            onOk() {
                const changed = app.description !== tempVal.tempDescription
                app.description = tempVal.tempDescription
                if (changed) self.onUpdateConfigAndSave()
            },
        })
    }

    renameAppTo(newName: string) {
        const self = this
        const appDef = Utils.copyObject(self.state.apiData!.appDefinition)
        self.setState({ isLoading: true })
        this.apiManager
            .renameApp(appDef.appName!, newName)
            .then(function () {
                return self.reFetchData()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    onUpdateConfigAndSave() {
        const self = this
        const appDef = Utils.copyObject(self.state.apiData!.appDefinition)
        self.setState({ isLoading: true })
        this.apiManager
            .updateConfigAndSave(appDef.appName!, appDef)
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

        if (!self.state.apiData && self.state.isLoading) {
            return <CenteredSpinner />
        }

        if (!self.reRenderTriggered) {
            // crazy hack to make sure the Affix is showing (delete and save & update)
            self.reRenderTriggered = true
            setTimeout(function () {
                self.setState({ renderCounterForAffixBug: 1 })
            }, 50)
        }

        if (!self.state.apiData) {
            return <ErrorRetry />
        }

        const app = self.state.apiData.appDefinition

        return (
            <Row>
                <Col span={20} offset={2}>
                    <Card
                        extra={
                            <ClickableLink
                                onLinkClicked={() => self.goBackToApps()}
                            >
                                <Tooltip title="Close">
                                    <CloseOutlined />
                                </Tooltip>
                            </ClickableLink>
                        }
                        title={
                            <span>
                                <ClickableLink
                                    onLinkClicked={() =>
                                        self.openRenameAppDialog()
                                    }
                                >
                                    <Tooltip
                                        title="Rename app"
                                        placement="bottom"
                                    >
                                        <EditOutlined />
                                    </Tooltip>
                                </ClickableLink>
                                &nbsp;&nbsp;
                                {app.appName}
                                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                <ClickableLink
                                    onLinkClicked={() => self.viewDescription()}
                                >
                                    <Popover
                                        placement="bottom"
                                        content={
                                            <div
                                                style={{
                                                    maxWidth: 300,
                                                    whiteSpace: 'pre-line',
                                                }}
                                            >
                                                {app.description ||
                                                    'Click to edit app description...'}
                                            </div>
                                        }
                                        title="App description"
                                    >
                                        <ReadOutlined />
                                    </Popover>
                                </ClickableLink>
                            </span>
                        }
                    >
                        {this.state.isLoading && (
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                }}
                            >
                                <CenteredSpinner />
                            </div>
                        )}
                        <Tabs
                            defaultActiveKey={WEB_SETTINGS}
                            onChange={(key) => {
                                self.setState({ activeTabKey: key })
                            }}
                            className={classnames({
                                disabled: this.state.isLoading,
                            })}
                            items={[
                                {
                                    key: WEB_SETTINGS,
                                    label: (
                                        <span className="unselectable-span">
                                            HTTP Settings
                                        </span>
                                    ),
                                    children: (
                                        <HttpSettings
                                            isMobile={this.props.isMobile}
                                            setLoading={(value) =>
                                                this.setState({
                                                    isLoading: value,
                                                })
                                            }
                                            reFetchData={() =>
                                                this.reFetchData()
                                            }
                                            apiData={Utils.copyObject(
                                                this.state.apiData!
                                            )}
                                            apiManager={this.apiManager}
                                            updateApiData={(newData: any) =>
                                                this.setState({
                                                    apiData: newData,
                                                })
                                            }
                                            onUpdateConfigAndSave={() =>
                                                self.onUpdateConfigAndSave()
                                            }
                                        />
                                    ),
                                },
                                {
                                    key: APP_CONFIGS,
                                    label: (
                                        <span className="unselectable-span">
                                            App Configs
                                        </span>
                                    ),
                                    children: (
                                        <AppConfigs
                                            isMobile={this.props.isMobile}
                                            setLoading={(value) =>
                                                this.setState({
                                                    isLoading: value,
                                                })
                                            }
                                            reFetchData={() =>
                                                this.reFetchData()
                                            }
                                            apiData={Utils.copyObject(
                                                this.state.apiData!
                                            )}
                                            apiManager={this.apiManager}
                                            updateApiData={(newData: any) =>
                                                this.setState({
                                                    apiData: newData,
                                                })
                                            }
                                            onUpdateConfigAndSave={() => {
                                                self.onUpdateConfigAndSave()
                                            }}
                                        />
                                    ),
                                },
                                {
                                    key: DEPLOYMENT,
                                    label: (
                                        <span className="unselectable-span">
                                            Deployment
                                        </span>
                                    ),
                                    children: (
                                        <Deployment
                                            isMobile={this.props.isMobile}
                                            setLoading={(value) =>
                                                this.setState({
                                                    isLoading: value,
                                                })
                                            }
                                            reFetchData={() =>
                                                this.reFetchData()
                                            }
                                            apiData={Utils.copyObject(
                                                this.state.apiData!
                                            )}
                                            apiManager={this.apiManager}
                                            onUpdateConfigAndSave={() =>
                                                self.onUpdateConfigAndSave()
                                            }
                                            updateApiData={(newData: any) => {
                                                this.setState({
                                                    apiData: newData,
                                                })
                                            }}
                                        />
                                    ),
                                },
                            ]}
                        ></Tabs>
                        <div style={{ height: 70 }} />

                        <Affix
                            offsetBottom={10}
                            target={() => {
                                const newLocal = self.props.mainContainer
                                return newLocal && newLocal.current
                                    ? newLocal.current
                                    : window
                            }}
                        >
                            <div
                                className={classnames({
                                    'hide-on-demand':
                                        self.state.activeTabKey === DEPLOYMENT,
                                    disabled: this.state.isLoading,
                                })}
                                style={{
                                    borderRadius: 8,
                                    background: 'rgba(51,73,90,0.9)',
                                    paddingTop: 20,
                                    paddingBottom: 20,
                                }}
                            >
                                <Row justify="center" gutter={20}>
                                    <Col span={8}>
                                        <div style={{ textAlign: 'center' }}>
                                            <Button
                                                style={{
                                                    minWidth: self.props
                                                        .isMobile
                                                        ? 35
                                                        : 135,
                                                }}
                                                danger
                                                size="large"
                                                onClick={() =>
                                                    onDeleteAppClicked(
                                                        [
                                                            Utils.copyObject(
                                                                self.state
                                                                    .apiData!
                                                                    .appDefinition
                                                            ),
                                                        ],
                                                        self.apiManager,
                                                        (success) => {
                                                            // with or without error, go back to apps
                                                            self.goBackToApps()
                                                        }
                                                    )
                                                }
                                            >
                                                {self.props.isMobile ? (
                                                    <DeleteOutlined />
                                                ) : (
                                                    'Delete App'
                                                )}
                                            </Button>
                                        </div>
                                    </Col>
                                    <Col span={8}>
                                        <div style={{ textAlign: 'center' }}>
                                            <Button
                                                style={{
                                                    minWidth: self.props
                                                        .isMobile
                                                        ? 35
                                                        : 135,
                                                }}
                                                type="primary"
                                                size="large"
                                                onClick={() =>
                                                    self.onUpdateConfigAndSave()
                                                }
                                            >
                                                {self.props.isMobile ? (
                                                    <SaveOutlined />
                                                ) : (
                                                    'Save & Restart'
                                                )}
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </Affix>
                    </Card>
                </Col>
            </Row>
        )
    }

    componentDidMount() {
        this.reFetchData()
    }

    reFetchData() {
        const self = this
        self.setState({ isLoading: true })
        return this.apiManager
            .getAllApps()
            .then(function (data: any) {
                for (
                    let index = 0;
                    index < data.appDefinitions.length;
                    index++
                ) {
                    const element = data.appDefinitions[index]
                    if (element.appName === self.props.match.params.appName) {
                        self.setState({
                            isLoading: false,
                            apiData: {
                                appDefinition: element,
                                rootDomain: data.rootDomain,
                                captainSubDomain: data.captainSubDomain,
                                defaultNginxConfig: data.defaultNginxConfig,
                            },
                        })
                        return
                    }
                }

                // App Not Found!
                self.goBackToApps()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
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
)(AppDetails)
