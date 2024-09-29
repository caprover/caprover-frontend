import { Button, Card, Input, Row, Select } from 'antd'
import { RefObject } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { IMobileComponent } from '../../models/ContainerProps'
import ProjectDefinition from '../../models/ProjectDefinition'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'

interface PropsInterface extends RouteComponentProps<any> {
    mainContainer: RefObject<HTMLDivElement>
    isMobile: boolean
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

        const projectOptions = [
            {
                value: '',
                label: 'root <no parent>',
            },
        ]

        self.state.allProjects.forEach((it) => {
            if (selectedProject.id === it.id) return
            projectOptions.push({
                value: it.id,
                label: it.name,
            })
        })

        return (
            <Row justify={'center'} style={{ marginTop: 30 }}>
                <Card>
                    <div>
                        <h3>{'Edit project: ' + selectedProject.name}</h3>
                        <p>
                            You can edit the name, description and change the
                            parent of this project.
                        </p>
                        <div style={{ height: 20 }} />
                        <div>
                            <Input
                                addonBefore="Project Name"
                                placeholder="my-awesome-project"
                                type="text"
                                value={selectedProject.name}
                                onChange={(e) => {
                                    const newData =
                                        Utils.copyObject(selectedProject)
                                    newData.name = e.target.value.trim()
                                    self.setState({
                                        selectedProject: newData,
                                    })
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
                            <Select
                                showSearch
                                style={{ width: '100%' }}
                                placeholder="Select a parent project"
                                optionFilterProp="label"
                                value={selectedProject.parentProjectId || ''}
                                onChange={(value: string) => {
                                    const newData =
                                        Utils.copyObject(selectedProject)
                                    newData.parentProjectId = value.trim()
                                    self.setState({
                                        selectedProject: newData,
                                    })
                                }}
                                options={projectOptions}
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
                                placeholder="This project is just so awesome!"
                                value={selectedProject.description}
                                onChange={(e) => {
                                    const newData =
                                        Utils.copyObject(selectedProject)
                                    newData.description = e.target.value.trim()
                                    self.setState({
                                        selectedProject: newData,
                                    })
                                }}
                            />
                            <Row style={{ marginTop: 48 }} justify="end">
                                <Button
                                    style={{ marginRight: 20 }}
                                    onClick={() => self.goBackToApps()}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        self.saveProject()
                                    }}
                                    type="primary"
                                >
                                    {' '}
                                    Save
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

                const selectedProject = projects.find(
                    (it) => it.id === self.props.match.params.projectId
                )

                if (!selectedProject) {
                    self.goBackToApps()
                } else {
                    self.setState({
                        selectedProject: selectedProject,
                        allProjects: projects,
                    })
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
