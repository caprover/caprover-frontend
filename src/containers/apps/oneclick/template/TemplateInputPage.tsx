import { Alert, Button, Card, Col, Row } from 'antd'
import { RouteComponentProps } from 'react-router'
import { localize } from '../../../../utils/Language'
import ApiComponent from '../../../global/ApiComponent'
import InputJsonifier from '../../../global/InputJsonifier'
import NewTabLink from '../../../global/NewTabLink'
import { TEMPLATE_ONE_CLICK_APP } from '../selector/OneClickAppSelector'

export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

export default class TemplateInputPage extends ApiComponent<
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

    createCustomTemplateInput() {
        const self = this

        let isOneClickJsonValid = true
        if (this.state.templateOneClickAppData) {
            try {
                JSON.parse(this.state.templateOneClickAppData)
            } catch (error) {
                isOneClickJsonValid = false
            }
        }

        return (
            <div>
                <div>
                    <p>
                        {localize(
                            'oneclick_app_selector.custom_template_info',
                            'This is mainly for testing. You can copy and paste your custom One-Click app template here. For examples and ideas, see '
                        )}
                        <NewTabLink url="https://github.com/caprover/one-click-apps/tree/master/public/v4/apps">
                            {localize(
                                'oneclick_app_selector.one_click_apps_github_repository_main_repo',
                                'the main one click apps GitHub repository'
                            )}
                        </NewTabLink>{' '}
                    </p>
                </div>

                <InputJsonifier
                    placeholder={`YAML or JSON # use captainVersion 4
captainVersion: 4
services:
    $$cap_appname:
        image: someimage:$$cap_version
        caproverExtra:
            containerHttpPort: '8080'
caproverOneClickApp:
    variables:
        - id: $$cap_version
          label: Version Tag
          description: Check out their Docker page for the valid tags https://hub.docker.com/r/library/..../tags/
          defaultValue: '4'
          validRegex: /^(1.2.3)+$/
    instructions:
        start: >-
            Some description for the start instruction.
        end: Some description for the end instruction.
    displayName: Adminer
    isOfficial: true
    description: Some really good description of the app.
    documentation: 'Taken from https://hub.docker.com/_/someimage '
    `}
                    onChange={(stringified) => {
                        self.setState({
                            templateOneClickAppData: stringified,
                        })
                    }}
                />
                <div style={{ height: 10 }} />
                {!isOneClickJsonValid ? (
                    <Alert
                        message={localize(
                            'oneclick_app_selector.invalid_json_alert',
                            "One Click data that you've entered is not a valid JSON."
                        )}
                        type="error"
                    />
                ) : (
                    <div />
                )}
                <div style={{ height: 30 }} />
                <Row justify="space-between" align="middle">
                    <Button
                        onClick={() =>
                            self.props.history.push(
                                `/apps/oneclick/${TEMPLATE_ONE_CLICK_APP}?${ONE_CLICK_APP_STRINGIFIED_KEY}=` +
                                    encodeURIComponent(
                                        self.state.templateOneClickAppData
                                    )
                            )
                        }
                        disabled={
                            !self.state.templateOneClickAppData ||
                            !isOneClickJsonValid
                        }
                        style={{ minWidth: 150 }}
                        type="primary"
                    >
                        {localize('oneclick_app_selector.next_button', 'Next')}
                    </Button>
                </Row>
            </div>
        )
    }

    render() {
        const self = this

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 23 }}>
                        <Card
                            title={localize(
                                'oneclick_app_selector.template_card_title',
                                'Custom One-Click App Template'
                            )}
                        >
                            {self.createCustomTemplateInput()}
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
