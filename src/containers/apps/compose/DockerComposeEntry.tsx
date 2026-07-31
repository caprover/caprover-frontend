import { Button, Card, Col, Input, Row, Typography } from 'antd'
import { RouteComponentProps } from 'react-router'
import ParentProjectSelector from '../../../components/ParentProjectSelector'
import ProjectDefinition from '../../../models/ProjectDefinition'
import { localize } from '../../../utils/Language'
import {
    isProjectNameAllowed,
    normalizeProjectName,
} from '../../../utils/ProjectName'
import Toaster from '../../../utils/Toaster'
import Utils from '../../../utils/Utils'
import { createOneClickDeploymentUrl } from '../../../utils/OneClickDeploymentUrl'
import ApiComponent from '../../global/ApiComponent'
import CenteredSpinner from '../../global/CenteredSpinner'
import ErrorRetry from '../../global/ErrorRetry'
import InputJsonifier from '../../global/InputJsonifier'

export const TEMPLATE_ONE_CLICK_APP = 'TEMPLATE_ONE_CLICK_APP'
export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

export function getDockerComposeServiceCount(template: any): number {
    if (!template?.services || typeof template.services !== 'object') {
        return 0
    }
    return Object.keys(template.services).length
}

export default class DockerComposeEntry extends ApiComponent<
    RouteComponentProps<any>,
    {
        stringifiedJsonComposeContent: string
        projects: ProjectDefinition[] | undefined
        selectedProjectId: string
        projectName: string
        loadError: boolean
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            stringifiedJsonComposeContent: '',
            projects: undefined,
            selectedProjectId: '',
            projectName: '',
            loadError: false,
        }
    }

    componentDidMount() {
        const self = this
        self.apiManager
            .getAllProjects()
            .then(function (response) {
                if (!self.willUnmountSoon) {
                    self.setState({
                        projects: (response.projects ||
                            []) as ProjectDefinition[],
                    })
                }
            })
            .catch(function (error) {
                Toaster.createCatcher()(error)
                if (!self.willUnmountSoon) {
                    self.setState({ loadError: true })
                }
            })
    }

    render() {
        const self = this

        let parsedJson = undefined as any
        try {
            parsedJson = JSON.parse(this.state.stringifiedJsonComposeContent)
        } catch (error) {}

        if (self.state.loadError) {
            return <ErrorRetry />
        }

        if (!self.state.projects) {
            return <CenteredSpinner />
        }

        const serviceCount = getDockerComposeServiceCount(parsedJson)
        const isMultiService = serviceCount > 1
        const normalizedProjectName = normalizeProjectName(
            self.state.projectName
        )

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 16 }}>
                        <Card title="Docker Compose">
                            <div>
                                <Typography.Paragraph>
                                    {Utils.formatText(
                                        localize(
                                            'one_click_app_selector.description',
                                            'Please paste your Docker Compose YAML file below. Make sure you read the %s1.'
                                        ),
                                        ['%s1'],
                                        [
                                            <a
                                                href="https://caprover.com/docs/docker-compose.html"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {localize(
                                                    'one_click_app_selector.documentation_link',
                                                    'Docker Compose compatibility documentation'
                                                )}
                                            </a>,
                                        ]
                                    )}
                                </Typography.Paragraph>
                                <InputJsonifier
                                    placeholder={`services:
  mysql:
    image: mysql:8.0
    container_name: my-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: rootpass123
      MYSQL_DATABASE: myapp_db
      MYSQL_USER: myuser
      MYSQL_PASSWORD: mypass123
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
`}
                                    onChange={(jsonString) => {
                                        self.setState({
                                            stringifiedJsonComposeContent:
                                                jsonString,
                                        })
                                    }}
                                />
                            </div>
                            <ParentProjectSelector
                                projects={self.state.projects}
                                selectedProjectId={self.state.selectedProjectId}
                                onChange={(selectedProjectId) => {
                                    self.setState({ selectedProjectId })
                                }}
                                hideWhenEmpty={false}
                                style={{ marginTop: 24 }}
                            />
                            {isMultiService && (
                                <div style={{ marginTop: 24 }}>
                                    <div style={{ marginBottom: 5 }}>
                                        {localize(
                                            'projects.project_name',
                                            'Project Name'
                                        )}
                                    </div>
                                    <Input
                                        aria-required="true"
                                        placeholder="my-compose-stack"
                                        value={self.state.projectName}
                                        status={
                                            self.state.projectName &&
                                            !isProjectNameAllowed(
                                                normalizedProjectName
                                            )
                                                ? 'error'
                                                : undefined
                                        }
                                        onChange={(event) => {
                                            self.setState({
                                                projectName: event.target.value,
                                            })
                                        }}
                                        onBlur={(event) => {
                                            self.setState({
                                                projectName:
                                                    normalizeProjectName(
                                                        event.target.value
                                                    ),
                                            })
                                        }}
                                    />
                                </div>
                            )}
                            <Row justify="end" style={{ marginTop: 15 }}>
                                <Button
                                    size="large"
                                    style={{ minWidth: 150 }}
                                    type="primary"
                                    onClick={() => {
                                        if (serviceCount === 0) {
                                            Toaster.toastError(
                                                localize(
                                                    'one_click_app_selector.invalid_compose_json_toast',
                                                    'The Docker Compose JSON you have entered is not valid. Please fix it before proceeding.'
                                                )
                                            )
                                            return
                                        }
                                        if (
                                            isMultiService &&
                                            !isProjectNameAllowed(
                                                normalizedProjectName
                                            )
                                        ) {
                                            Toaster.toastError(
                                                localize(
                                                    'docker_compose_entry.invalid_project_name',
                                                    'Enter a valid lowercase project name using letters, numbers, and single hyphens.'
                                                )
                                            )
                                            return
                                        }
                                        self.deploy(
                                            parsedJson,
                                            isMultiService
                                                ? normalizedProjectName
                                                : undefined
                                        )
                                    }}
                                >
                                    {' '}
                                    {localize(
                                        'one_click_app_selector.deploy_button',
                                        'Deploy'
                                    )}
                                </Button>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
    deploy(template: any, projectName?: string) {
        const self = this
        const deploymentTemplate = Utils.copyObject(template)
        deploymentTemplate.captainVersion = 4
        deploymentTemplate.caproverOneClickApp = {
            instructions: {
                start: localize(
                    'docker_compose_entry.start_instruction_text',
                    'Your app is being deployed. This may take a few minutes. Please wait...'
                ),
                end: localize(
                    'docker_compose_entry.end_instruction_text',
                    'Your app is deployed.'
                ),
            },
            variables: [],
        }

        const deployUrl = createOneClickDeploymentUrl({
            template: deploymentTemplate,
            valuesArray: [],
            appName: 'Docker Compose',
            parentProjectId: self.state.selectedProjectId,
            projectName,
        })
        self.props.history.push(deployUrl)
    }
}
