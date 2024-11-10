import { PlusCircleOutlined, QuestionCircleFilled } from '@ant-design/icons'
import { Button, Card, Checkbox, Col, Input, Row, Tooltip } from 'antd'
import { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import ProjectSelector from '../../components/ProjectSelector'
import { IMobileComponent } from '../../models/ContainerProps'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import NewTabLink from '../global/NewTabLink'

interface MyProps {
    onCreateNewAppClicked: (
        appName: string,
        projectId: string,
        hasPersistency: boolean
    ) => void
    onOneClickAppClicked: () => void
    onDockerComposeClicked: () => void

    projects: ProjectDefinition[]
}

class CreateNewApp extends Component<
    MyProps & IMobileComponent,
    { appName: string; selectedProjectId: string; hasPersistency: boolean }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            hasPersistency: false,
            appName: '',
            selectedProjectId: '',
        }
    }

    onCreateNewAppClicked() {
        this.props.onCreateNewAppClicked(
            this.state.appName,
            this.state.selectedProjectId,
            this.state.hasPersistency
        )
    }
    render() {
        const self = this

        return (
            <Card
                title={
                    <span>
                        <PlusCircleOutlined />
                        &nbsp;&nbsp;&nbsp;{' '}
                        {localize('create_new_app.title', 'Create A New App')}
                    </span>
                }
            >
                <Row
                    style={{
                        marginBottom: 20,
                    }}
                >
                    <Col md={12} sm={24} xs={24}>
                        <div
                            style={{
                                paddingBottom: 20,
                                width: '100%',
                                textAlign: 'center',
                            }}
                        >
                            {localize(
                                'create_new_app.scratch',
                                'Create from scratch'
                            )}
                            <hr style={{ opacity: 0.1 }} />
                        </div>
                        {self.createProjectInApp()}
                        <Row style={{ marginTop: 30, marginBottom: 30 }}>
                            <Checkbox
                                onChange={(e: any) =>
                                    self.setState({
                                        hasPersistency: !!e.target.checked,
                                    })
                                }
                            >
                                {localize(
                                    'create_new_app.has_persistent_data',
                                    'Has Persistent Data'
                                )}{' '}
                            </Checkbox>
                            &nbsp;&nbsp;
                            <NewTabLink url="https://caprover.com/docs/persistent-apps.html">
                                <Tooltip
                                    title={localize(
                                        'create_new_app.has_persistent_data_tooltip',
                                        'Mostly used for databases, see docs for details.'
                                    )}
                                >
                                    <span>
                                        <QuestionCircleFilled />
                                    </span>
                                </Tooltip>
                            </NewTabLink>
                        </Row>
                        {self.props.isMobile ? (
                            <Fragment>
                                <Input
                                    placeholder={localize(
                                        'create_new_app.placeholder',
                                        'my-amazing-app'
                                    )}
                                    onChange={(e) =>
                                        self.setState({
                                            appName: e.target.value,
                                        })
                                    }
                                />
                                <Button
                                    style={{ marginTop: 8 }}
                                    block
                                    onClick={() => self.onCreateNewAppClicked()}
                                    type="primary"
                                >
                                    {localize(
                                        'create_new_app.button',
                                        'Create New App'
                                    )}
                                </Button>
                            </Fragment>
                        ) : (
                            <Input.Search
                                placeholder={localize(
                                    'create_new_app.placeholder',
                                    'my-amazing-app'
                                )}
                                enterButton={localize(
                                    'create_new_app.button',
                                    'Create New App'
                                )}
                                onChange={(e) =>
                                    self.setState({
                                        appName: e.target.value,
                                    })
                                }
                                onSearch={(value) =>
                                    self.onCreateNewAppClicked()
                                }
                            />
                        )}
                    </Col>
                    <Col md={4} sm={24}></Col>
                    <Col md={8} sm={24} xs={24}>
                        <Row justify={'center'}>
                            <div
                                style={{
                                    paddingBottom: 20,
                                    width: '100%',
                                    textAlign: 'center',
                                }}
                            >
                                {localize(
                                    'create_new_app.or_select_from',
                                    'Or select from'
                                )}
                                <hr style={{ opacity: 0.1 }} />
                            </div>
                            <div
                                style={{
                                    marginBottom: 15,
                                    width: '100%',
                                    textAlign: 'center',
                                }}
                            >
                                <Button
                                    block
                                    type="default"
                                    onClick={() => {
                                        self.props.onOneClickAppClicked()
                                    }}
                                >
                                    {localize(
                                        'create_new_app.one_click_apps',
                                        'One-Click Apps/Databases'
                                    )}
                                </Button>
                            </div>
                            <div
                                style={{
                                    marginBottom: 15,
                                    width: '100%',
                                    textAlign: 'center',
                                }}
                            >
                                <Button
                                    block
                                    type="default"
                                    onClick={() => {
                                        self.props.onDockerComposeClicked()
                                    }}
                                >
                                    {localize(
                                        'create_new_app.docker_compose',
                                        'Docker Compose'
                                    )}
                                </Button>
                            </div>
                        </Row>
                    </Col>
                </Row>
            </Card>
        )
    }

    createProjectInApp() {
        const self = this

        if ((self.props.projects || []).length === 0) {
            return undefined
        }

        return (
            <div>
                {' '}
                <div
                    style={{
                        marginBottom: 5,
                    }}
                >
                    {localize('apps.parent_project', 'Parent project')}
                </div>
                <ProjectSelector
                    allProjects={self.props.projects}
                    selectedProjectId={self.state.selectedProjectId}
                    onChange={(value: string) => {
                        self.setState({
                            selectedProjectId: value,
                        })
                    }}
                    excludeProjectId={'NONE'}
                />
            </div>
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
)(CreateNewApp)
