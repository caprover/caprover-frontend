import { Card, Col, Row } from 'antd'
import { RouteComponentProps } from 'react-router'
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
        //  const self = this
    }

    render() {
        const self = this

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 16 }}>
                        <Card title="Docker Compose">
                            <div>
                                Testing Docker Compose
                                <CodeEdit
                                    onChange={(newValue) => {
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
