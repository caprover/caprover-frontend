import { RouteComponentProps } from 'react-router'
import { IOneClickTemplate } from '../../../../models/IOneClickAppModels'
import DomUtils from '../../../../utils/DomUtils'
import Toaster from '../../../../utils/Toaster'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'
import {
    DEPLOYMENT_QUERY_PARAM_APP_NAME,
    DEPLOYMENT_QUERY_PARAM_TEMPLATE,
    DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY,
} from './OneClickAppConfigPage'
import OneClickAppDeployProgress from './OneClickAppDeployProgress'

export default class OneClickDeploymentPage extends ApiComponent<
    RouteComponentProps<any>,
    {
        oneClickJobId?: string
        appName: string
        template?: IOneClickTemplate
        valuesArray?: Array<{ key: string; value: string }>
    }
> {
    private isUnmount: boolean = false

    constructor(props: any) {
        super(props)
        this.state = {
            oneClickJobId: undefined,
            appName: '',
            template: undefined,
            valuesArray: undefined,
        }
    }

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) super.componentWillUnmount()
        this.isUnmount = true
    }

    componentDidMount() {
        const self = this
        const qs = new URLSearchParams(self.props.location.search)

        const templateStr = qs.get(DEPLOYMENT_QUERY_PARAM_TEMPLATE)
        const valuesArrayStr = qs.get(DEPLOYMENT_QUERY_PARAM_VALUES_ARRAY)
        const appName = qs.get(DEPLOYMENT_QUERY_PARAM_APP_NAME) || ''

        if (!templateStr || !valuesArrayStr || !appName) {
            Toaster.createCatcher()(
                'Missing required parameters for deployment'
            )
            self.props.history.goBack()
            return
        }

        try {
            const template = JSON.parse(templateStr) as IOneClickTemplate
            const valuesArray = JSON.parse(valuesArrayStr) as Array<{
                key: string
                value: string
            }>

            self.setState({
                appName,
                template,
                valuesArray,
            })

            // Start deployment immediately
            DomUtils.scrollToTopBar()
            self.apiManager
                .startOneClickAppDeploy(template, valuesArray)
                .then((data: any) => {
                    // store job id and render progress component
                    self.setState({
                        oneClickJobId: data.jobId,
                    })
                })
                .catch(
                    Toaster.createCatcher(() => {
                        self.props.history.goBack()
                    })
                )
        } catch (error) {
            Toaster.createCatcher()('Invalid parameters for deployment')
            self.props.history.goBack()
        }
    }

    render() {
        const self = this

        if (!this.state.oneClickJobId) {
            return <CenteredSpinner />
        }

        return (
            <OneClickAppDeployProgress
                appName={self.state.appName}
                jobId={self.state.oneClickJobId}
                onFinishClicked={() => self.props.history.push('/apps')}
                onRestartClicked={() => self.props.history.goBack()}
            />
        )
    }
}
