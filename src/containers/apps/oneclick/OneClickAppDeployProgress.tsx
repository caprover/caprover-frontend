import { LoadingOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Col, Row, Steps } from 'antd'
import React, { Component } from 'react'
import { Prompt } from 'react-router-dom'
import { IDeploymentState } from './OneClickAppDeployManager'

const Step = Steps.Step

export default class OneClickAppDeployProgress extends Component<{
    appName: string
    deploymentState: IDeploymentState
    onRestartClicked: () => void
    onFinishClicked: () => void
}> {
    createSteps() {
        const steps = this.props.deploymentState.steps
        const stepsInfo = []

        for (let index = 0; index < steps.length; index++) {
            stepsInfo.push({
                text: (
                    <span>
                        <span>
                            {index === this.props.deploymentState.currentStep &&
                            !this.props.deploymentState.error ? (
                                <LoadingOutlined
                                    style={{
                                        fontSize: '16px',
                                        paddingRight: 12,
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
        const { successMessage, error } = this.props.deploymentState
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

    render() {
        const self = this

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
                                            !!self.props.deploymentState.error
                                                ? 'error'
                                                : undefined
                                        }
                                        direction="vertical"
                                        current={
                                            self.props.deploymentState
                                                .currentStep
                                        }
                                    >
                                        {self.createSteps()}
                                    </Steps>

                                    <div
                                        className={
                                            !!self.props.deploymentState
                                                .successMessage
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
                                                        whiteSpace: 'pre-line',
                                                    }}
                                                >
                                                    {
                                                        self.props
                                                            .deploymentState
                                                            .successMessage
                                                    }
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
                                            !!self.props.deploymentState.error
                                                ? ''
                                                : 'hide-on-demand'
                                        }
                                    >
                                        <div style={{ height: 20 }} />
                                        <Alert
                                            showIcon
                                            type="error"
                                            message={
                                                self.props.deploymentState.error
                                            }
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
}
