import { LoadingOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Steps } from 'antd'
import ReactMarkdown from 'react-markdown'
import { Prompt } from 'react-router-dom'
import Toaster from '../../../utils/Toaster'
import ApiComponent from '../../global/ApiComponent'

interface IDeploymentState {
    steps: string[]
    error: string
    successMessage?: string
    currentStep: number
}
const Step = Steps.Step
const REFRESH_INTERVAL_MS = 2000

export default class OneClickAppDeployProgress extends ApiComponent<
    {
        appName: string
        jobId?: string
        onRestartClicked: () => void
        onFinishClicked: () => void
    },
    { deploymentState?: IDeploymentState }
> {
    private pollIntervalId: any = undefined

    createSteps() {
        const deploymentState = this.getDeploymentState()
        const steps = deploymentState.steps
        const stepsInfo = []

        for (let index = 0; index < steps.length; index++) {
            stepsInfo.push({
                text: (
                    <span>
                        <span>
                            {index === deploymentState.currentStep &&
                            !deploymentState.error ? (
                                <LoadingOutlined
                                    style={{
                                        fontSize: '16px',
                                        marginInlineEnd: 12,
                                    }}
                                />
                            ) : (
                                <span />
                            )}
                        </span>
                        {steps[index]}
                    </span>
                ),
                key: steps[index],
                icon: undefined,
            })
        }

        return stepsInfo.map((s) => {
            return <Step key={s.key} icon={s.icon} title={s.text} />
        })
    }

    isRunning() {
        const { successMessage, error } = this.getDeploymentState()
        return !successMessage && !error
    }

    blockNavigationIfRunning() {
        return (
            <Prompt
                when={this.isRunning()}
                message={`A deployment is running!
Are you sure you want to leave this page?
It will interrupt the deployment at the current step, leaving the applications in potentially inconsistent state.`}
            />
        )
    }

    componentDidMount() {
        // If jobId provided, start polling backend
        if (this.props.jobId) {
            this.startPolling(this.props.jobId)
        }
    }

    componentWillUnmount() {
        if (this.pollIntervalId) clearTimeout(this.pollIntervalId)
    }

    startPolling(jobId: string) {
        // start a sequential polling loop
        this.fetchLoop(jobId)
    }

    private fetchLoop(jobId: string) {
        // call backend, then schedule next call 2s after completion (if still running)
        this.apiManager
            .getOneClickDeployProgress(jobId)
            .then((res: any) => {
                const deploymentState: IDeploymentState = {
                    steps: res.steps || ['Queued'],
                    error: res.error || '',
                    successMessage: res.successMessage,
                    currentStep: res.currentStep || 0,
                }

                this.setState({ deploymentState })

                if (
                    !(deploymentState.error || deploymentState.successMessage)
                ) {
                    // still running -> schedule next fetch 2s later
                    this.pollIntervalId = setTimeout(() => {
                        this.fetchLoop(jobId)
                    }, REFRESH_INTERVAL_MS)
                } else {
                    this.pollIntervalId = undefined
                }
            })
            .catch(() => {
                Toaster.toastError(
                    'Error fetching deployment status. Retrying...'
                )
                this.pollIntervalId = setTimeout(() => {
                    this.fetchLoop(jobId)
                }, REFRESH_INTERVAL_MS)
            })
    }

    render() {
        const self = this
        const deploymentState = this.getDeploymentState()

        return (
            <div>
                {self.blockNavigationIfRunning()}
                <div>
                    <Row justify="center">
                        <Col xs={{ span: 23 }} lg={{ span: 16 }}>
                            <Card
                                title={`Deploying your ${this.props.appName}`}
                            >
                                <p>
                                    This process takes a few minutes to
                                    complete. DO NOT refresh this page and DO
                                    NOT navigate away!!!
                                </p>
                                <div style={{ padding: 20 }}>
                                    <h3>Progress:</h3>
                                    <div style={{ height: 20 }} />
                                    <Steps
                                        status={
                                            !!deploymentState.error
                                                ? 'error'
                                                : undefined
                                        }
                                        direction="vertical"
                                        current={deploymentState.currentStep}
                                    >
                                        {self.createSteps()}
                                    </Steps>

                                    <div
                                        className={
                                            !!deploymentState.successMessage
                                                ? ''
                                                : 'hide-on-demand'
                                        }
                                    >
                                        <div style={{ height: 20 }} />
                                        <Alert
                                            showIcon
                                            type="success"
                                            message={
                                                <div
                                                    style={{
                                                        whiteSpace: 'pre-wrap',
                                                    }}
                                                >
                                                    <ReactMarkdown>
                                                        {deploymentState.successMessage ||
                                                            ''}
                                                    </ReactMarkdown>
                                                </div>
                                            }
                                        />
                                        <div style={{ height: 80 }} />
                                        <Row justify="end">
                                            <Button
                                                style={{ minWidth: 150 }}
                                                size="large"
                                                type="primary"
                                                onClick={() =>
                                                    self.props.onFinishClicked()
                                                }
                                            >
                                                Finish
                                            </Button>
                                        </Row>
                                    </div>

                                    <div
                                        className={
                                            !!deploymentState.error
                                                ? ''
                                                : 'hide-on-demand'
                                        }
                                    >
                                        <div style={{ height: 20 }} />
                                        <Alert
                                            showIcon
                                            type="error"
                                            message={deploymentState.error}
                                        />
                                        <div style={{ height: 80 }} />

                                        <Row justify="end">
                                            <Button
                                                size="large"
                                                type="primary"
                                                onClick={() =>
                                                    self.props.onRestartClicked()
                                                }
                                            >
                                                Go Back &amp; Try Again
                                            </Button>
                                        </Row>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    </Row>
                </div>
            </div>
        )
    }

    private getDeploymentState(): IDeploymentState {
        return (
            this.state.deploymentState || {
                steps: ['Queued'],
                error: '',
                currentStep: 0,
            }
        )
    }
}
