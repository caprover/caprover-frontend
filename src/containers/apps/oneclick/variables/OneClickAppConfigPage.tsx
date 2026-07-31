import { Card, Col, Row } from 'antd'
import ReactMarkdown from 'react-markdown'
import { RouteComponentProps } from 'react-router'
import gfm from 'remark-gfm'
import ParentProjectSelector from '../../../../components/ParentProjectSelector'
import { IOneClickTemplate } from '../../../../models/IOneClickAppModels'
import ProjectDefinition from '../../../../models/ProjectDefinition'
import ErrorFactory from '../../../../utils/ErrorFactory'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import { createOneClickDeploymentUrl } from '../../../../utils/OneClickDeploymentUrl'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'
import ErrorRetry from '../../../global/ErrorRetry'
import {
    ONE_CLICK_APP_STRINGIFIED_KEY,
    TEMPLATE_ONE_CLICK_APP,
} from '../selector/OneClickAppSelector'
import OneClickVariablesSection from './OneClickVariablesSection'

export const ONE_CLICK_APP_NAME_VAR_NAME = '$$cap_appname'
export const ONE_CLICK_ROOT_DOMAIN_VAR_NAME = '$$cap_root_domain'

export {
    DEPLOYMENT_QUERY_PARAM_APP_NAME,
    DEPLOYMENT_QUERY_PARAM_TEMPLATE,
    DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY,
} from '../../../../utils/OneClickDeploymentUrl'

export default class OneClickAppConfigPage extends ApiComponent<
    RouteComponentProps<any>,
    {
        apiData: IOneClickTemplate | undefined
        rootDomain: string
        projects: ProjectDefinition[] | undefined
        selectedProjectId: string
        loadError: boolean
    }
> {
    private isUnmount: boolean = false

    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
            rootDomain: '',
            projects: undefined,
            selectedProjectId: '',
            loadError: false,
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
        const promiseToFetchOneClick =
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

                return Promise.all([
                    Promise.resolve(data),
                    self.apiManager.getCaptainInfo(),
                    self.apiManager.getAllProjects(),
                ])
            })
            .then(function ([apiData, captainInfo, projectsResponse]) {
                if (self.isUnmount) {
                    return
                }
                self.setState({
                    apiData,
                    rootDomain: captainInfo.rootDomain,
                    projects: (projectsResponse.projects ||
                        []) as ProjectDefinition[],
                })
            })
            .catch(function (error) {
                Toaster.createCatcher()(error)
                if (!self.isUnmount) {
                    self.setState({ loadError: true })
                }
            })
    }

    render() {
        const self = this
        const apiData = this.state.apiData
        const displayName =
            apiData && apiData.caproverOneClickApp.displayName
                ? apiData.caproverOneClickApp.displayName
                : self.props.match.params.appName[0].toUpperCase() +
                  self.props.match.params.appName.slice(1)

        if (self.state.loadError) {
            return <ErrorRetry />
        }

        if (!apiData || !self.state.projects) {
            return <CenteredSpinner />
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
                            <ParentProjectSelector
                                projects={self.state.projects || []}
                                selectedProjectId={self.state.selectedProjectId}
                                onChange={(selectedProjectId) => {
                                    self.setState({ selectedProjectId })
                                }}
                                hideWhenEmpty={false}
                                style={{ marginBottom: 24 }}
                            />
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

                                    const appName =
                                        self.props.match.params.appName
                                    const deployUrl =
                                        createOneClickDeploymentUrl({
                                            template,
                                            valuesArray,
                                            appName,
                                            parentProjectId:
                                                self.state.selectedProjectId,
                                        })
                                    self.props.history.push(deployUrl)
                                }}
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
