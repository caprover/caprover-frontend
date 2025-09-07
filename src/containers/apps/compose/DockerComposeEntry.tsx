import { Card, Col, Row, Typography } from 'antd'
import { RouteComponentProps } from 'react-router'
import { localize } from '../../../utils/Language'
import Utils from '../../../utils/Utils'
import ApiComponent from '../../global/ApiComponent'
import CodeEdit from '../../global/CodeEdit'

export const TEMPLATE_ONE_CLICK_APP = 'TEMPLATE_ONE_CLICK_APP'
export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

export default class OneClickAppSelector extends ApiComponent<
    RouteComponentProps<any>,
    {
        templateOneClickAppData: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            templateOneClickAppData: '',
        }
    }

    componentDidMount() {
        // const self = this
    }

    render() {
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

                                <CodeEdit
                                    onChange={() => {
                                        // self.setState({ templateOneClickAppData: newValue })
                                    }}
                                />
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
