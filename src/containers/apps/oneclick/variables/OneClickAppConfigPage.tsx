import { Card, Col, Row } from 'antd'
import ReactMarkdown from 'react-markdown'
import { RouteComponentProps } from 'react-router'
import gfm from 'remark-gfm'
import { IOneClickTemplate } from '../../../../models/IOneClickAppModels'
import DomUtils from '../../../../utils/DomUtils'
import ErrorFactory from '../../../../utils/ErrorFactory'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'
import {
    ONE_CLICK_APP_STRINGIFIED_KEY,
    TEMPLATE_ONE_CLICK_APP,
} from '../selector/OneClickAppSelector'
import OneClickAppDeployProgress from './OneClickAppDeployProgress'
import OneClickVariablesSection from './OneClickVariablesSection'

export const ONE_CLICK_APP_NAME_VAR_NAME = '$$cap_appname'
export const ONE_CLICK_ROOT_DOMAIN_VAR_NAME = '$$cap_root_domain'

export default class OneClickAppConfigPage extends ApiComponent<
    RouteComponentProps<any>,
    {
        apiData: IOneClickTemplate | undefined
        rootDomain: string
        oneClickJobId?: string
    }
> {
    private isUnmount: boolean = false

    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
            rootDomain: '',
            oneClickJobId: undefined,
        }
    }

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) super.componentWillUnmount()
        this.isUnmount = true
    }

    componentDidMount() {
        const self = this

        const appNameFromPath = this.props.match.params.appName
        const qs = new URLSearchParams(self.props.location.search)
        const baseDomainFromPath = qs.get('baseDomain')
        let promiseToFetchOneClick =
            appNameFromPath === TEMPLATE_ONE_CLICK_APP
                ? new Promise<any>(function (resolve) {
                      resolve(
                          JSON.parse(
                              qs.get(ONE_CLICK_APP_STRINGIFIED_KEY) as string
                          )
                      )
                  })
                : self.apiManager
                      .getOneClickAppByName(
                          appNameFromPath,
                          baseDomainFromPath as string
                      )
                      .then(function (data) {
                          return data.appTemplate
                      })

        let apiData: IOneClickTemplate

        promiseToFetchOneClick
            .then(function (data: IOneClickTemplate) {
                return JSON.parse(
                    Utils.replaceAllGenRandomForOneClickApp(
                        JSON.stringify(data)
                    )
                ) as IOneClickTemplate
            })
            .then(function (data: IOneClickTemplate) {
                if (`${data.captainVersion}` !== '4') {
                    throw ErrorFactory.createError(
                        ErrorFactory.ILLEGAL_PARAMETER,
                        `One-click app version is ${data.captainVersion}, this version supports "v4". Make sure your CapRover is up-to-date with the latest version!!`
                    )
                }

                data.caproverOneClickApp.variables =
                    data.caproverOneClickApp.variables || []
                // Adding app name to all one click apps
                data.caproverOneClickApp.variables.unshift({
                    id: ONE_CLICK_APP_NAME_VAR_NAME,
                    label: 'App Name',
                    description:
                        'This is your app name. Pick a name such as my-first-1-click-app',
                    validRegex: '/^([a-z0-9]+\\-)*[a-z0-9]+$/', // string version of /^([a-z0-9]+\-)*[a-z0-9]+$/
                })

                apiData = data

                return self.apiManager.getCaptainInfo()
            })
            .then(function (captainInfo) {
                self.setState({
                    apiData: apiData,
                    rootDomain: captainInfo.rootDomain,
                })
            })
            .catch(Toaster.createCatcher())
    }

    render() {
        const self = this
        const apiData = this.state.apiData
        const displayName =
            apiData && apiData.caproverOneClickApp.displayName
                ? apiData.caproverOneClickApp.displayName
                : self.props.match.params.appName[0].toUpperCase() +
                  self.props.match.params.appName.slice(1)

        if (!apiData) {
            return <CenteredSpinner />
        }

        // If we have an active backend job id, render progress and poll
        if (this.state.oneClickJobId) {
            return (
                <OneClickAppDeployProgress
                    appName={self.props.match.params.appName}
                    jobId={self.state.oneClickJobId}
                    onFinishClicked={() => self.props.history.push('/apps')}
                    onRestartClicked={() =>
                        self.setState({ oneClickJobId: undefined })
                    }
                />
            )
        }

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 16 }}>
                        <Card title={`Setup your ${displayName}`}>
                            <h2>{displayName}</h2>
                            <div
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    paddingLeft: 15,
                                    paddingRight: 15,
                                }}
                            >
                                <ReactMarkdown remarkPlugins={[gfm]}>
                                    {
                                        apiData.caproverOneClickApp.instructions
                                            .start
                                    }
                                </ReactMarkdown>
                            </div>
                            <div style={{ height: 40 }} />
                            <OneClickVariablesSection
                                oneClickAppVariables={
                                    apiData.caproverOneClickApp.variables
                                }
                                onNextClicked={(values) => {
                                    const template = Utils.copyObject(
                                        self.state.apiData!
                                    )
                                    const valuesAugmented =
                                        Utils.copyObject(values)

                                    template.caproverOneClickApp.variables.push(
                                        {
                                            id: ONE_CLICK_ROOT_DOMAIN_VAR_NAME,
                                            label: 'CapRover root domain',
                                        }
                                    )
                                    valuesAugmented[
                                        ONE_CLICK_ROOT_DOMAIN_VAR_NAME
                                    ] = self.state.rootDomain

                                    const valuesArray = Object.keys(
                                        valuesAugmented
                                    ).map((key) => {
                                        return {
                                            key: key,
                                            value: valuesAugmented[key],
                                        }
                                    })

                                    DomUtils.scrollToTopBar()
                                    self.apiManager
                                        .startOneClickAppDeploy(
                                            template,
                                            valuesArray
                                        )
                                        .then((data: any) => {
                                            // store job id and render progress component
                                            self.setState({
                                                oneClickJobId: data.jobId,
                                            })
                                        })
                                        .catch(Toaster.createCatcher())
                                }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
