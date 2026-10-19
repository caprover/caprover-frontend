import { ExperimentOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Space, Tag, Typography } from 'antd'
import { RouteComponentProps } from 'react-router'
import { getIgnoredDockerComposeFields } from '../../../utils/dockerComposeFields'
import { localize } from '../../../utils/Language'
import normalizeComposeTemplate from '../../../utils/normalizeComposeTemplate'
import Toaster from '../../../utils/Toaster'
import Utils from '../../../utils/Utils'
import ApiComponent from '../../global/ApiComponent'
import InputJsonifier from '../../global/InputJsonifier'
import {
    DEPLOYMENT_QUERY_PARAM_APP_NAME,
    DEPLOYMENT_QUERY_PARAM_TEMPLATE,
    DEPLOYMENT_QUERY_PARAM_TEMPLATE_NAME,
    DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY,
} from '../oneclick/OneClickDeploymentConstants'

export const TEMPLATE_ONE_CLICK_APP = 'TEMPLATE_ONE_CLICK_APP'
export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

function DockerComposeWarnings({ fields }: { fields: string[] }) {
    if (fields.length === 0) return <></>

    return (
        <Alert
            showIcon
            type="warning"
            style={{ marginTop: 16 }}
            message={localize(
                'docker_compose_entry.ignored_fields_title',
                'These fields will be ignored'
            )}
            description={
                <div>
                    <p>
                        {localize(
                            'docker_compose_entry.ignored_fields_description',
                            'CapRover does not use the following fields during deployment. Review them before deploying.'
                        )}
                    </p>
                    <ul style={{ paddingInlineStart: 20 }}>
                        {fields.map((field) => (
                            <li key={field}>
                                <Tag
                                    color="warning"
                                    style={{
                                        whiteSpace: 'normal',
                                        overflowWrap: 'anywhere',
                                    }}
                                >
                                    <code>{field}</code>
                                </Tag>
                            </li>
                        ))}
                    </ul>
                </div>
            }
        />
    )
}

export default class OneClickAppSelector extends ApiComponent<
    RouteComponentProps<any>,
    {
        stringifiedJsonComposeContent: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            stringifiedJsonComposeContent: '',
        }
    }

    componentDidMount() {
        // const self = this
    }

    render() {
        const self = this

        let parsedJson = undefined as any
        let compatibilityError = ''
        try {
            parsedJson = JSON.parse(this.state.stringifiedJsonComposeContent)
        } catch (error) {}
        if (parsedJson?.services) {
            try {
                parsedJson = normalizeComposeTemplate(parsedJson)
            } catch (error) {
                compatibilityError = (error as Error).message
            }
        }

        const ignoredFields = getIgnoredDockerComposeFields(parsedJson)

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 16 }}>
                        <Card
                            title={
                                <Space>
                                    <ExperimentOutlined />
                                    <span>Docker Compose</span>
                                    <Tag color="warning">
                                        {localize(
                                            'docker_compose_entry.experimental_badge',
                                            'Experimental'
                                        )}
                                    </Tag>
                                </Space>
                            }
                        >
                            <div>
                                <Alert
                                    showIcon
                                    type="warning"
                                    message={localize(
                                        'docker_compose_entry.experimental_title',
                                        'Docker Compose support is experimental'
                                    )}
                                    description={localize(
                                        'docker_compose_entry.experimental_description',
                                        'Some Docker Compose options may be unsupported or behave differently in CapRover. Review the compatibility documentation and verify your deployment before using it in production.'
                                    )}
                                    style={{ marginBottom: 16 }}
                                />
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
                                <DockerComposeWarnings fields={ignoredFields} />
                                {compatibilityError && (
                                    <Alert
                                        showIcon
                                        type="error"
                                        message={compatibilityError}
                                        style={{ marginTop: 16 }}
                                    />
                                )}
                            </div>
                            <Row justify="end" style={{ marginTop: 15 }}>
                                <Button
                                    size="large"
                                    style={{ minWidth: 150 }}
                                    type="primary"
                                    disabled={!!compatibilityError}
                                    onClick={() => {
                                        if (!parsedJson?.services) {
                                            Toaster.toastError(
                                                localize(
                                                    'one_click_app_selector.invalid_compose_json_toast',
                                                    'The Docker Compose JSON you have entered is not valid. Please fix it before proceeding.'
                                                )
                                            )
                                            return
                                        }
                                        self.deploy(parsedJson)
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
    deploy(template: any) {
        const self = this
        // Navigate to deployment page with template and values
        // TODO move the constants to a common file
        template.captainVersion = 4
        template.caproverOneClickApp = {
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

        const templateStr = encodeURIComponent(JSON.stringify(template))
        const valuesArrayStr = encodeURIComponent(JSON.stringify([]))
        const appName = 'Docker Compose'
        const templateName = 'DOCKER_COMPOSE'
        const deployUrl = `/apps/oneclick/deployment?${DEPLOYMENT_QUERY_PARAM_TEMPLATE}=${templateStr}&${DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY}=${valuesArrayStr}&${DEPLOYMENT_QUERY_PARAM_APP_NAME}=${appName}&${DEPLOYMENT_QUERY_PARAM_TEMPLATE_NAME}=${templateName}`
        self.props.history.push(deployUrl)
    }
}
