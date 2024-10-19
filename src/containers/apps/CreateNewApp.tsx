import { PlusCircleOutlined, QuestionCircleFilled } from '@ant-design/icons'
import { Button, Card, Checkbox, Divider, Input, Row, Tooltip } from 'antd'
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
                            onSearch={(value) => self.onCreateNewAppClicked()}
                        />
                    )}
                </Row>

                {self.createProjectInApp()}

                <Row
                    style={{ marginTop: 30 }}
                    justify={self.props.isMobile ? 'start' : 'end'}
                >
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
                <Divider type="horizontal" style={{ width: 100 }} />

                <div style={{ textAlign: 'center' }}>
                    <p>
                        {localize(
                            'create_new_app.or_select_from',
                            'Or Select From'
                        )}
                    </p>

                    <Button
                        type="dashed"
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
                        marginTop: 32,
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
