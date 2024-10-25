import { Alert, Button, Card, Col, Row } from 'antd'
import { RouteComponentProps } from 'react-router'
import { IOneClickAppIdentifier } from '../../../../models/IOneClickAppModels'
import { localize } from '../../../../utils/Language'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'
import InputJsonifier from '../../../global/InputJsonifier'
import NewTabLink from '../../../global/NewTabLink'
import OneClickGrid from './OneClickGrid'
import OneClickReposList from './OneClickReposList'

export const TEMPLATE_ONE_CLICK_APP = 'TEMPLATE_ONE_CLICK_APP'
export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

export default class OneClickAppSelector extends ApiComponent<
    RouteComponentProps<any>,
    {
        oneClickAppList: IOneClickAppIdentifier[] | undefined
        isCustomTemplateSelected: boolean
        templateOneClickAppData: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            oneClickAppList: undefined,
            isCustomTemplateSelected: false,
            templateOneClickAppData: '',
        }
    }

    componentDidMount() {
        const self = this
        self.fetchData()
    }

    fetchData() {
        const self = this
        self.apiManager
            .getAllOneClickApps()
            .then(function (data) {
                const apps = data.oneClickApps as IOneClickAppIdentifier[]
                apps.push({
                    name: TEMPLATE_ONE_CLICK_APP,
                    description: localize(
                        'oneclick_app_selector.template_description',
                        'A template for creating one-click apps. Mainly for development!'
                    ),
                    logoUrl: '/icon-512x512.png',
                    baseUrl: '',
                    displayName: '>> TEMPLATE <<',
                })
                self.setState({
                    oneClickAppList: apps,
                })
            })
            .catch(Toaster.createCatcher())
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
            <div
                className={
                    self.state.isCustomTemplateSelected ? '' : 'hide-on-demand'
                }
            >
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
                                `/apps/oneclick/${TEMPLATE_ONE_CLICK_APP}` +
                                    (`?${ONE_CLICK_APP_STRINGIFIED_KEY}=` +
                                        encodeURIComponent(
                                            self.state.templateOneClickAppData
                                        ))
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

    createOneClickAppListGrid() {
        const self = this

        if (!this.state.oneClickAppList) return <CenteredSpinner />

        return (
            <OneClickGrid
                onAppSelectionChanged={(event, appName) => {
                    if (appName === TEMPLATE_ONE_CLICK_APP) {
                        event.preventDefault()
                        self.setState({ isCustomTemplateSelected: true })
                    }
                }}
                oneClickAppList={self.state.oneClickAppList!}
            />
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
                                'oneclick_app_selector.card_title',
                                'One Click Apps'
                            )}
                        >
                            {' '}
                            {Utils.isSafari() ? (
                                <div style={{ marginBottom: 50 }}>
                                    <Alert
                                        message={localize(
                                            'oneclick_app_selector.safari_warning',
                                            'You seem to be using Safari. Deployment of one-click apps may be unstable on Safari. Using Chrome is recommended'
                                        )}
                                        type="warning"
                                    />
                                </div>
                            ) : (
                                <div />
                            )}
                            <div
                                className={
                                    self.state.isCustomTemplateSelected
                                        ? 'hide-on-demand'
                                        : ''
                                }
                            >
                                <p>
                                    {localize(
                                        'oneclick_app_selector.app_selection_info',
                                        'Choose an app, a database or a bundle (app+database) from the list below. The rest is magic, well... Wizard!'
                                    )}
                                </p>
                                <p>
                                    {localize(
                                        'oneclick_app_selector.one_click_apps_source',
                                        'One click apps are retrieved from the official '
                                    )}
                                    <NewTabLink url="https://github.com/caprover/one-click-apps">
                                        {localize(
                                            'oneclick_app_selector.one_click_apps_github_repository',
                                            'CapRover One Click Apps Repository'
                                        )}
                                    </NewTabLink>{' '}
                                    {localize(
                                        'oneclick_app_selector.one_click_apps_source_end',
                                        'by default. You can add other public/private repositories if you want to.'
                                    )}
                                </p>

                                {self.createOneClickAppListGrid()}

                                <div style={{ height: 50 }} />

                                <OneClickReposList />
                            </div>
                            {self.createCustomTemplateInput()}
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
