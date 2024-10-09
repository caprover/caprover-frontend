import { Button, Card, Input, Row } from 'antd'
import { RefObject } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import ProjectSelector from '../../components/ProjectSelector'
import { IMobileComponent } from '../../models/ContainerProps'
import ProjectDefinition from '../../models/ProjectDefinition'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'

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
    }
> {
    constructor(props: any) {
        super(props)

        this.state = {
            isLoading: true,
            selectedProject: undefined,
            allProjects: [],
        }
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
                                'You can set the name, description and the parent of this project.'
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
