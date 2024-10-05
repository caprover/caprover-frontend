import { CloseOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons'
import {
    Affix,
    Button,
    Card,
    Col,
    Input,
    Modal,
    Row,
    Tabs,
    Tag,
    Tooltip,
    Typography,
} from 'antd'
import classnames from 'classnames'
import { ReactNode, RefObject } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import ApiManager from '../../../api/ApiManager'
import ProjectSelector from '../../../components/ProjectSelector'
import { IMobileComponent } from '../../../models/ContainerProps'
import { IHashMapGeneric } from '../../../models/IHashMapGeneric'
import ProjectDefinition from '../../../models/ProjectDefinition'
import Toaster from '../../../utils/Toaster'
import Utils from '../../../utils/Utils'
import ApiComponent from '../../global/ApiComponent'
import CenteredSpinner from '../../global/CenteredSpinner'
import ClickableLink from '../../global/ClickableLink'
import ErrorRetry from '../../global/ErrorRetry'
import { IAppDef } from '../AppDefinition'
import onDeleteAppClicked from '../DeleteAppConfirm'
import EditableSpan from '../EditableSpan'
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
    projects: ProjectDefinition[]
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
        editAppDataForModal:
            | {
                  appName: string
                  description: string
                  parentProjectId: string
                  tags: string[]
              }
            | undefined
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
            editAppDataForModal: undefined,
        }
    }

    goBackToApps() {
        this.props.history.push('/apps')
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

    createProjectBreadcrumbs() {
        const self = this
        const apiData = self.state.apiData
        const app = apiData?.appDefinition
        if (!app || !apiData) {
            throw new Error('App not found')
        }

        let currentProjectId = app.projectId

        if (!currentProjectId || !currentProjectId.trim()) {
            return <div />
        }

        const projectMap = {} as IHashMapGeneric<ProjectDefinition>

        apiData.projects.forEach((it) => {
            projectMap[it.id] = it
        })

        const projectsBreadCrumbs = [] as ProjectDefinition[]

        while (currentProjectId) {
            const currentProject: ProjectDefinition | undefined =
                projectMap[currentProjectId]
            if (currentProject) {
                projectsBreadCrumbs.unshift(currentProject)
                currentProjectId = currentProject.parentProjectId
            } else {
                break
            }
        }

        return (
            <div style={{ marginBottom: 10, fontSize: 12 }}>
                {projectsBreadCrumbs.map((project, index) => (
                    <span key={project.id}>
                        <span style={{ marginLeft: 5 }}> {' > '}</span>
                        {project.name}
                    </span>
                ))}
            </div>
        )
    }

    createAppHeader() {
        const self = this
        const app = self.state.apiData?.appDefinition
        if (!app) {
            throw new Error('App not found')
        }

        const appName = app.appName || ''

        return (
            <div style={{ marginTop: 20, marginBottom: 10, width: '100%' }}>
                <div
                    style={{
                        position: 'absolute',
                        padding: 12,
                        right: 12,
                        top: 0,
                    }}
                >
                    <ClickableLink onLinkClicked={() => self.goBackToApps()}>
                        <Tooltip title="Close">
                            <CloseOutlined />
                        </Tooltip>
                    </ClickableLink>
                </div>
                <div>{self.createProjectBreadcrumbs()}</div>

                <h2 style={{ marginBottom: 5, marginTop: 0, marginLeft: 12 }}>
                    <EditableSpan
                        onEditClick={() => {
                            self.setState({
                                editAppDataForModal: {
                                    parentProjectId: app.projectId || '',
                                    appName: appName,
                                    description: app.description || '',
                                    tags: (app.tags || []).map(
                                        (it) => it.tagName
                                    ),
                                },
                            })
                        }}
                    >
                        {appName}
                    </EditableSpan>
                </h2>

                {app.tags && app.tags.length > 0 && (
                    <span style={{ marginLeft: 12 }}>
                        {app.tags.map((tag, index) => (
                            <Tag key={index}>{tag.tagName}</Tag>
                        ))}
                    </span>
                )}
                {self.createDescription()}
            </div>
        )
    }

    createDescription(): import('react').ReactNode {
        const self = this
        const app = self.state.apiData?.appDefinition
        if (!app) {
            throw new Error('App not found')
        }

        if (!app.description) return <div />

        return (
            <div style={{ marginLeft: 16, marginTop: 28 }}>
                <Typography.Paragraph
                    style={{
                        fontSize: 14,
                        fontWeight: 400,
                        whiteSpace: 'pre-wrap',
                    }}
                    ellipsis={{
                        rows: 1,
                        expandable: true,
                        symbol: 'more',
                    }}
                >
                    {app.description}
                </Typography.Paragraph>
            </div>
        )
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

        return (
            <Row>
                {self.createEditAppModal()}
                <Col span={20} offset={2}>
                    <Card title={self.createAppHeader()}>
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
                                                        [],
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

    createEditAppModal(): ReactNode {
        const self = this

        const editAppDataForModal = self.state.editAppDataForModal

        if (!editAppDataForModal) return <div />

        return (
            <Modal
                title={`Edit "${self.state.apiData?.appDefinition.appName}" app`}
                okText="Save & Update"
                onCancel={() =>
                    self.setState({ editAppDataForModal: undefined })
                }
                onOk={() => {
                    const newData = Utils.copyObject(self.state.apiData)
                    if (!newData) return

                    const isNameChanged =
                        newData.appDefinition.appName !==
                        editAppDataForModal.appName

                    const editAppDataForModalCopy = Utils.copyObject(
                        self.state.editAppDataForModal
                    )
                    if (!editAppDataForModalCopy) return

                    self.setState({
                        isLoading: true,
                        editAppDataForModal: undefined,
                    })

                    return Promise.resolve()
                        .then(() => {
                            if (isNameChanged) {
                                Toaster.toastInfo('Renaming the app...')
                                return self.apiManager.renameApp(
                                    newData.appDefinition.appName!,
                                    editAppDataForModalCopy.appName
                                )
                            }
                        })
                        .then(() => {
                            newData.appDefinition.appName =
                                editAppDataForModalCopy.appName
                            newData.appDefinition.projectId =
                                editAppDataForModalCopy.parentProjectId
                            newData.appDefinition.description =
                                editAppDataForModalCopy.description
                            newData.appDefinition.tags =
                                editAppDataForModalCopy.tags.map((it) => {
                                    return { tagName: it }
                                })

                            self.props.history.replace(
                                '/apps/details/' +
                                    editAppDataForModalCopy.appName
                            )
                            self.setState({
                                apiData: newData,
                            })

                            setTimeout(() => {
                                // posting after a delay to ensure the state is updated!!
                                // maybe it's fine to post on the same thread, but I am not sure if React stays the same in future versions.
                                self.onUpdateConfigAndSave()
                            }, 200)
                        })
                }}
                open={!!editAppDataForModal}
            >
                <p>
                    If you rename the app that is used internally by other apps,
                    make sure to update the address as well to avoid problems.
                </p>
                <div style={{ height: 20 }} />
                <div>
                    <Input
                        addonBefore="App name"
                        placeholder="my-awesome-app"
                        value={editAppDataForModal.appName}
                        onChange={(e) => {
                            const newData =
                                Utils.copyObject(editAppDataForModal)
                            newData.appName = e.target.value.trim()
                            self.setState({ editAppDataForModal: newData })
                        }}
                    />
                    <div style={{ height: 32 }} />
                    <Input
                        addonBefore="Tags"
                        placeholder="tag1,another-tag,yet-another <comma separated>"
                        value={editAppDataForModal.tags.join(',')}
                        onChange={(e) => {
                            const newData =
                                Utils.copyObject(editAppDataForModal)
                            newData.tags = e.target.value
                                .trim()
                                .split(',')
                                .map((it) => it.trim())
                            self.setState({ editAppDataForModal: newData })
                        }}
                    />

                    <div
                        style={{
                            marginTop: 32,
                            marginBottom: 5,
                            marginLeft: 5,
                        }}
                    >
                        Parent project
                    </div>
                    <ProjectSelector
                        allProjects={self.state.apiData?.projects || []}
                        selectedProjectId={
                            editAppDataForModal.parentProjectId || ''
                        }
                        onChange={(value: string) => {
                            const newData =
                                Utils.copyObject(editAppDataForModal)
                            newData.parentProjectId = value.trim()
                            self.setState({
                                editAppDataForModal: newData,
                            })
                        }}
                        excludeProjectId={'NONE'}
                    />
                    <div
                        style={{
                            marginTop: 32,
                            marginBottom: 5,
                            marginLeft: 5,
                        }}
                    >
                        Description
                    </div>
                    <Input.TextArea
                        rows={4}
                        placeholder={
                            'This app is just so awesome!\nAnotherline!'
                        }
                        value={editAppDataForModal.description}
                        onChange={(e) => {
                            const newData =
                                Utils.copyObject(editAppDataForModal)
                            newData.description = e.target.value
                            self.setState({
                                editAppDataForModal: newData,
                            })
                        }}
                    />
                    <div style={{ height: 20 }} />
                </div>
            </Modal>
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
            .then(function (dataReturns: any) {
                const getAppsResp = dataReturns[0]
                const projects = dataReturns[1].projects || []

                for (
                    let index = 0;
                    index < getAppsResp.appDefinitions.length;
                    index++
                ) {
                    const element = getAppsResp.appDefinitions[index]
                    if (element.appName === self.props.match.params.appName) {
                        self.setState({
                            isLoading: false,
                            apiData: {
                                projects: projects,
                                appDefinition: element,
                                rootDomain: getAppsResp.rootDomain,
                                captainSubDomain: getAppsResp.captainSubDomain,
                                defaultNginxConfig:
                                    getAppsResp.defaultNginxConfig,
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
