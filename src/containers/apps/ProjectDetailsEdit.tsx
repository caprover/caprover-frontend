import { EditFilled, EditOutlined } from '@ant-design/icons'
import { Button, Card, Col, Input, Row, Tooltip } from 'antd'
import { RefObject } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import ProjectSelector from '../../components/ProjectSelector'
import { IMobileComponent } from '../../models/ContainerProps'
import { IHashMapGeneric } from '../../models/IHashMapGeneric'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import CodeEdit from '../global/CodeEdit'
import ErrorRetry from '../global/ErrorRetry'
import { IAppEnvVar } from './AppDefinition'

interface PropsInterface extends RouteComponentProps<any> {
    mainContainer: RefObject<HTMLDivElement>
    isMobile: boolean

    createNewProject: boolean
}

class ProjectDetailsEdit extends ApiComponent<
    PropsInterface,
    {
        isLoading: boolean
        selectedProject: ProjectDefinition | undefined
        allProjects: ProjectDefinition[]
        envVarBulkEdit: boolean
        envVarBulkVals: string
    }
> {
    constructor(props: any) {
        super(props)

        this.state = {
            isLoading: true,
            selectedProject: undefined,
            allProjects: [],
            envVarBulkEdit: false,
            envVarBulkVals: '',
        }
    }

    parseEnvVars(src: string): IHashMapGeneric<string> {
        const obj: IHashMapGeneric<string> = {}
        src.toString()
            .split('\n')
            .forEach(function (line) {
                const keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
                if (!!keyValueArr) {
                    const key = keyValueArr[1]
                    let value = keyValueArr[2] || ''
                    const len = value ? value.length : 0
                    if (
                        len > 0 &&
                        value.charAt(0) === '"' &&
                        value.charAt(len - 1) === '"'
                    ) {
                        value = value.replace(/\\n/gm, '\n')
                    }
                    value = value.replace(/(^['"]|['"]$)/g, '').trim()
                    obj[key] = value
                }
            })
        return obj
    }

    convertEnvVarsToBulk(envVars: IAppEnvVar[]): string {
        return envVars
            .map((e) => {
                let val = e.value
                if (val.indexOf('\n') >= 0) {
                    val = `"${val.split('\n').join('\\n')}"`
                }
                return `${e.key}=${val}`
            })
            .join('\n')
    }

    createEnvVarSection() {
        const self = this
        const selectedProject = self.state.selectedProject!
        const envVars = selectedProject.envVars || []

        const updateEnvVars = (updated: IAppEnvVar[]) => {
            const newData = Utils.copyObject(selectedProject)
            newData.envVars = updated
            self.setState({ selectedProject: newData })
        }

        const toggleIcon = self.state.envVarBulkEdit ? (
            <Tooltip title="Switch to key/value editor">
                <EditFilled
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                        self.setState({
                            envVarBulkEdit: false,
                            envVarBulkVals: '',
                        })
                    }
                />
            </Tooltip>
        ) : (
            <Tooltip title="Switch to bulk editor">
                <EditOutlined
                    style={{ cursor: 'pointer' }}
                    onClick={() =>
                        self.setState({
                            envVarBulkEdit: true,
                            envVarBulkVals:
                                self.convertEnvVarsToBulk(envVars),
                        })
                    }
                />
            </Tooltip>
        )

        if (self.state.envVarBulkEdit) {
            return (
                <div>
                    <Row style={{ paddingBottom: 12 }}>
                        <Col span={24}>
                            <CodeEdit
                                placeholder={'key1=value1\nkey2=value2'}
                                rows={7}
                                value={
                                    self.state.envVarBulkVals
                                        ? self.state.envVarBulkVals
                                        : self.convertEnvVarsToBulk(envVars)
                                }
                                onChange={(e) => {
                                    const keyVals = self.parseEnvVars(
                                        e.target.value
                                    )
                                    const parsed: IAppEnvVar[] = []
                                    Object.keys(keyVals).forEach((k) => {
                                        parsed.push({
                                            key: k,
                                            value: keyVals[k],
                                        })
                                    })
                                    updateEnvVars(parsed)
                                    self.setState({
                                        envVarBulkVals: e.target.value,
                                    })
                                }}
                            />
                        </Col>
                    </Row>
                    <Row justify="end">{toggleIcon}</Row>
                </div>
            )
        }

        const rows = envVars.map((value, index) => (
            <Row style={{ paddingBottom: 12 }} key={`${index}`}>
                <Col span={8}>
                    <Input
                        spellCheck={false}
                        autoCorrect="off"
                        autoComplete="off"
                        autoCapitalize="off"
                        className="code-input"
                        placeholder="key"
                        value={value.key}
                        type="text"
                        onChange={(e) => {
                            const updated = Utils.copyObject(envVars)
                            updated[index].key = e.target.value
                            updateEnvVars(updated)
                        }}
                    />
                </Col>
                <Col style={{ paddingLeft: 12 }} span={13}>
                    <Input
                        spellCheck={false}
                        autoCorrect="off"
                        autoComplete="off"
                        autoCapitalize="off"
                        className="code-input"
                        placeholder="value"
                        value={value.value}
                        type="text"
                        onChange={(e) => {
                            const updated = Utils.copyObject(envVars)
                            updated[index].value = e.target.value
                            updateEnvVars(updated)
                        }}
                    />
                </Col>
                <Col style={{ paddingLeft: 12 }} span={3}>
                    <Button
                        danger
                        onClick={() => {
                            const updated = Utils.copyObject(envVars)
                            updated.splice(index, 1)
                            updateEnvVars(updated)
                        }}
                    >
                        ✕
                    </Button>
                </Col>
            </Row>
        ))

        return (
            <div>
                {rows}
                <Row style={{ paddingTop: 8 }} justify="space-between">
                    <Button
                        type="default"
                        onClick={() => {
                            updateEnvVars([
                                ...envVars,
                                { key: '', value: '' },
                            ])
                        }}
                    >
                        {localize(
                            'projects.add_env_var',
                            'Add Key/Value Pair'
                        )}
                    </Button>
                    {toggleIcon}
                </Row>
            </div>
        )
    }

    goBackToApps() {
        this.props.history.push('/apps')
    }

    render() {
        const self = this

        if (self.state.isLoading) {
            return <CenteredSpinner />
        }

        const selectedProject = self.state.selectedProject

        if (!selectedProject) {
            return <ErrorRetry />
        }

        const title = self.props.createNewProject
            ? localize('projects.new_project', 'Create a New Project')
            : localize('projects.edit_project', 'Edit project: ') +
              selectedProject.name

        return (
            <Row justify={'center'} style={{ marginTop: 30 }}>
                <Card>
                    <div>
                        <h3>{title}</h3>
                        <p>
                            {localize(
                                'projects.edit_project_hint',
                                'You can set the name, description, parent, and environment variables for this project.'
                            )}
                        </p>
                        <div style={{ height: 20 }} />
                        <div>
                            <Input
                                addonBefore={localize(
                                    'projects.project_name',
                                    'Project Name'
                                )}
                                placeholder="my-awesome-project"
                                type="text"
                                value={selectedProject.name}
                                onChange={(e) => {
                                    const newData =
                                        Utils.copyObject(selectedProject)

                                    let value = e.target.value
                                    if (
                                        value.endsWith('- ') ||
                                        value.endsWith('--') ||
                                        value.startsWith(' ') ||
                                        value.startsWith('-')
                                    ) {
                                        return // we don't want to allow --
                                    }

                                    if (value.endsWith(' ')) {
                                        value = value.trim() + '-'
                                    }
                                    value = value.toLocaleLowerCase()
                                    newData.name = value
                                    self.setState({
                                        selectedProject: newData,
                                    })
                                }}
                            />

                            <div
                                style={{
                                    marginTop: 32,
                                    marginBottom: 5,
                                }}
                            >
                                {localize(
                                    'apps.parent_project',
                                    'Parent project'
                                )}
                            </div>
                            <ProjectSelector
                                allProjects={self.state.allProjects}
                                selectedProjectId={
                                    selectedProject.parentProjectId || ''
                                }
                                onChange={(value: string) => {
                                    const newData =
                                        Utils.copyObject(selectedProject)
                                    newData.parentProjectId = value.trim()
                                    self.setState({
                                        selectedProject: newData,
                                    })
                                }}
                                excludeProjectId={selectedProject.id}
                            />
                            <div
                                style={{
                                    marginTop: 32,
                                    marginBottom: 5,
                                }}
                            >
                                {localize(
                                    'projects.edit_project_description',
                                    'Description'
                                )}
                            </div>
                            <Input.TextArea
                                rows={4}
                                placeholder={localize(
                                    'projects.edit_project_description_placeholder',
                                    'This project is just so awesome!'
                                )}
                                value={selectedProject.description}
                                onChange={(e) => {
                                    const newData =
                                        Utils.copyObject(selectedProject)
                                    newData.description = e.target.value
                                    self.setState({
                                        selectedProject: newData,
                                    })
                                }}
                            />
                            <div
                                style={{
                                    marginTop: 32,
                                    marginBottom: 5,
                                }}
                            >
                                {localize(
                                    'projects.env_vars',
                                    'Environment Variables'
                                )}
                            </div>
                            <p style={{ color: '#888', fontSize: 12 }}>
                                {localize(
                                    'projects.env_vars_hint',
                                    'Apps and sub-projects inside this project will inherit these variables. Apps can override them by defining their own variable with the same key.'
                                )}
                            </p>
                            {self.createEnvVarSection()}
                            <Row style={{ marginTop: 48 }} justify="end">
                                <Button
                                    style={{ marginInlineEnd: 20 }}
                                    onClick={() => self.goBackToApps()}
                                >
                                    {localize(
                                        'projects.edit_project_cancel',
                                        'Cancel'
                                    )}
                                </Button>
                                <Button
                                    onClick={() => {
                                        self.saveProject()
                                    }}
                                    type="primary"
                                >
                                    {localize(
                                        'projects.edit_project_save',
                                        'Save'
                                    )}
                                </Button>
                            </Row>
                        </div>
                    </div>
                </Card>
            </Row>
        )
    }

    saveProject() {
        const self = this
        const selectedProject = self.state.selectedProject
        if (!selectedProject) {
            Toaster.toastError('Cannot save an empty project')
            return
        }
        self.setState({ isLoading: true })

        if (self.props.createNewProject) {
            return self.apiManager
                .registerProject(selectedProject)
                .then(function (data: any) {
                    Toaster.toastSuccess('Project created')
                    self.goBackToApps()
                })
                .catch(Toaster.createCatcher())
                .then(function () {
                    self.setState({ isLoading: false })
                })
        } else {
            return self.apiManager
                .updateProject(selectedProject)
                .then(function (data: any) {
                    Toaster.toastSuccess('Project saved')
                    self.goBackToApps()
                })
                .catch(Toaster.createCatcher())
                .then(function () {
                    self.setState({ isLoading: false })
                })
        }
    }

    componentDidMount() {
        this.reFetchData()
    }

    reFetchData() {
        const self = this
        self.setState({ isLoading: true })
        return this.apiManager
            .getAllProjects()
            .then(function (data: any) {
                const projects = (data.projects || []) as ProjectDefinition[]

                const isNewApp = !!self.props.createNewProject

                if (isNewApp) {
                    self.setState({
                        selectedProject: {
                            id: '',
                            name: '',
                            description: '',
                            envVars: [],
                        },
                        allProjects: projects,
                    })
                } else {
                    const selectedProject = projects.find(
                        (it) => it.id === self.props.match.params.projectId
                    )

                    if (!selectedProject) {
                        self.goBackToApps()
                        Toaster.toastError('Project not found...')
                    } else {
                        self.setState({
                            selectedProject: selectedProject,
                            allProjects: projects,
                        })
                    }
                }
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
)(ProjectDetailsEdit)
