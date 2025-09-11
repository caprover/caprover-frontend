import { Button, Card, Col, Row, Typography } from 'antd'
import { RouteComponentProps } from 'react-router'
import { localize } from '../../../utils/Language'
import Toaster from '../../../utils/Toaster'
import Utils from '../../../utils/Utils'
import ApiComponent from '../../global/ApiComponent'
import InputJsonifier from '../../global/InputJsonifier'
import {
    DEPLOYMENT_QUERY_PARAM_APP_NAME,
    DEPLOYMENT_QUERY_PARAM_TEMPLATE,
    DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY,
} from '../oneclick/variables/OneClickAppConfigPage'

export const TEMPLATE_ONE_CLICK_APP = 'TEMPLATE_ONE_CLICK_APP'
export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

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
        try {
            parsedJson = JSON.parse(this.state.stringifiedJsonComposeContent)
        } catch (error) {}

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
                            <Row justify="end" style={{ marginTop: 15 }}>
                                <Button
                                    size="large"
                                    style={{ minWidth: 150 }}
                                    type="primary"
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

        const deployUrl = `/apps/oneclick/deployment?${DEPLOYMENT_QUERY_PARAM_TEMPLATE}=${templateStr}&${DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY}=${valuesArrayStr}&${DEPLOYMENT_QUERY_PARAM_APP_NAME}=${appName}`
        self.props.history.push(deployUrl)
    }
}
