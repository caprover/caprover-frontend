import { Alert, Card, Col, Row } from 'antd'
import { RouteComponentProps } from 'react-router'
import { IOneClickAppIdentifier } from '../../../../models/IOneClickAppModels'
import { localize } from '../../../../utils/Language'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'
import NewTabLink from '../../../global/NewTabLink'
import OneClickGrid from './OneClickGrid'
import OneClickReposList from './OneClickReposList'

export const TEMPLATE_ONE_CLICK_APP = 'TEMPLATE_ONE_CLICK_APP'
export const ONE_CLICK_APP_STRINGIFIED_KEY = 'oneClickAppStringifiedData'

export default class OneClickAppSelector extends ApiComponent<
    RouteComponentProps<any>,
    {
        oneClickAppList: IOneClickAppIdentifier[] | undefined
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            oneClickAppList: undefined,
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

    createOneClickAppListGrid() {
        const self = this

        if (!this.state.oneClickAppList) return <CenteredSpinner />

        return (
            <OneClickGrid
                onAppSelectionChanged={(event, appName) => {
                    if (appName === TEMPLATE_ONE_CLICK_APP) {
                        event.preventDefault()
                        self.props.history.push(
                            `/apps/oneclick/input/${TEMPLATE_ONE_CLICK_APP}`
                        )
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
                            <div>
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
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
