import { RouteComponentProps } from 'react-router'
import { IOneClickTemplate } from '../../../../models/IOneClickAppModels'
import DomUtils from '../../../../utils/DomUtils'
import { parseOneClickDeploymentUrl } from '../../../../utils/OneClickDeploymentUrl'
import Toaster from '../../../../utils/Toaster'
import ApiComponent from '../../../global/ApiComponent'
import CenteredSpinner from '../../../global/CenteredSpinner'
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

        try {
            const deployment = parseOneClickDeploymentUrl(
                self.props.location.search
            )

            self.setState({
                appName: deployment.appName,
                template: deployment.template,
                valuesArray: deployment.valuesArray,
            })

            // Start deployment immediately
            DomUtils.scrollToTopBar()
            self.apiManager
                .startOneClickAppDeploy(
                    deployment.template,
                    deployment.valuesArray,
                    {
                        parentProjectId: deployment.parentProjectId,
                        projectName: deployment.projectName,
                    }
                )
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
