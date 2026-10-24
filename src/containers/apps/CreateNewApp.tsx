import {
    AppstoreOutlined,
    CodeOutlined,
    FileAddOutlined,
    PlusOutlined,
    QuestionCircleFilled,
} from '@ant-design/icons'
import {
    Button,
    Checkbox,
    Dropdown,
    Form,
    Input,
    MenuProps,
    Modal,
    Tooltip,
    Typography,
} from 'antd'
import { History } from 'history'
import { Component, Fragment } from 'react'
import ProjectSelector from '../../components/ProjectSelector'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import NewTabLink from '../global/NewTabLink'

interface MyProps {
    onCreateNewAppClicked: (
        appName: string,
        projectId: string,
        hasPersistency: boolean
    ) => void
    history: History
    isCreatingApp: boolean
    projects: ProjectDefinition[]
}

export default class CreateNewApp extends Component<
    MyProps,
    {
        isModalOpen: boolean
        selectedProjectId: string
        hasPersistency: boolean
    }
> {
    constructor(props: MyProps) {
        super(props)
        this.state = {
            isModalOpen: false,
            hasPersistency: false,
            selectedProjectId: '',
        }
    }

    render() {
        const self = this
        const createAppText = localize(
            'create_new_app.create_app',
            'Create App'
        )

        const items: MenuProps['items'] = [
            {
                key: 'empty',
                icon: <FileAddOutlined />,
                label: (
                    <div>
                        {localize('create_new_app.empty_app', 'Empty App')}
                        <div>
                            <Typography.Text type="secondary">
                                {localize(
                                    'create_new_app.empty_app_description',
                                    'Deploy your own code or image'
                                )}
                            </Typography.Text>
                        </div>
                    </div>
                ),
                onClick: () =>
                    self.setState({
                        isModalOpen: true,
                        selectedProjectId: '',
                        hasPersistency: false,
                    }),
            },
            {
                key: 'oneclick',
                icon: <AppstoreOutlined />,
                label: (
                    <div>
                        {localize(
                            'create_new_app.one_click_app',
                            'One-Click App'
                        )}
                        <div>
                            <Typography.Text type="secondary">
                                {localize(
                                    'create_new_app.one_click_app_description',
                                    'Install a ready-to-use app or database'
                                )}
                            </Typography.Text>
                        </div>
                    </div>
                ),
                onClick: () => self.props.history.push('/apps/oneclick'),
            },
            {
                key: 'dockercompose',
                icon: <CodeOutlined />,
                label: (
                    <div>
                        {localize(
                            'create_new_app.docker_compose',
                            'Docker Compose'
                        )}
                        <div>
                            <Typography.Text type="secondary">
                                {localize(
                                    'create_new_app.docker_compose_description',
                                    'Deploy from a Compose file'
                                )}
                            </Typography.Text>
                        </div>
                    </div>
                ),
                onClick: () => self.props.history.push('/apps/dockercompose'),
            },
        ]

        return (
            <Fragment>
                <Dropdown autoFocus trigger={['click']} menu={{ items }}>
                    <Button type="primary" icon={<PlusOutlined />}>
                        {createAppText}
                    </Button>
                </Dropdown>
                {self.state.isModalOpen && (
                    <Modal
                        open
                        title={createAppText}
                        okText={createAppText}
                        cancelText={localize('create_new_app.cancel', 'Cancel')}
                        confirmLoading={self.props.isCreatingApp}
                        okButtonProps={{
                            htmlType: 'submit',
                            form: 'create-app-form',
                        }}
                        cancelButtonProps={{
                            disabled: self.props.isCreatingApp,
                        }}
                        closable={!self.props.isCreatingApp}
                        maskClosable={!self.props.isCreatingApp}
                        keyboard={!self.props.isCreatingApp}
                        onCancel={() => {
                            if (!self.props.isCreatingApp) {
                                self.setState({ isModalOpen: false })
                            }
                        }}
                    >
                        <Form
                            id="create-app-form"
                            layout="vertical"
                            disabled={self.props.isCreatingApp}
                            onSubmitCapture={(event) => {
                                if (self.props.isCreatingApp) {
                                    event.preventDefault()
                                    event.stopPropagation()
                                }
                            }}
                            onFinish={(values: { appName: string }) => {
                                self.props.onCreateNewAppClicked(
                                    values.appName,
                                    self.state.selectedProjectId,
                                    self.state.hasPersistency
                                )
                            }}
                        >
                            <Form.Item
                                name="appName"
                                label={localize(
                                    'create_new_app.application_name',
                                    'Application Name'
                                )}
                                rules={[
                                    {
                                        required: true,
                                        message: localize(
                                            'create_new_app.name_required',
                                            'Enter an application name.'
                                        ),
                                    },
                                ]}
                            >
                                <Input
                                    autoFocus
                                    placeholder={localize(
                                        'create_new_app.placeholder',
                                        'my-amazing-app'
                                    )}
                                />
                            </Form.Item>
                            {self.props.projects.length > 0 && (
                                <Form.Item
                                    label={localize(
                                        'apps.parent_project',
                                        'Parent project'
                                    )}
                                >
                                    <ProjectSelector
                                        allProjects={self.props.projects}
                                        selectedProjectId={
                                            self.state.selectedProjectId
                                        }
                                        onChange={(value: string) =>
                                            self.setState({
                                                selectedProjectId: value,
                                            })
                                        }
                                        excludeProjectId={'NONE'}
                                    />
                                </Form.Item>
                            )}
                            <Checkbox
                                checked={self.state.hasPersistency}
                                onChange={(e) =>
                                    self.setState({
                                        hasPersistency: e.target.checked,
                                    })
                                }
                            >
                                {localize(
                                    'create_new_app.has_persistent_data',
                                    'Has Persistent Data'
                                )}
                            </Checkbox>
                            <NewTabLink url="https://caprover.com/docs/persistent-apps.html">
                                <Tooltip
                                    title={localize(
                                        'create_new_app.has_persistent_data_tooltip',
                                        'Mostly used for databases, see docs for details.'
                                    )}
                                >
                                    <QuestionCircleFilled />
                                </Tooltip>
                            </NewTabLink>
                        </Form>
                    </Modal>
                )}
            </Fragment>
        )
    }
}
