import * as Icons from '@ant-design/icons'
import { Card, Col, Row, Tooltip } from 'antd'
import { Component, ReactNode } from 'react'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'

interface LoadBalancerStatsCardProps {
    icon: ReactNode
    titleText: string
    titleNumber: string
    text1: string
    text2: string
}

class LoadBalancerStatsCard extends Component<LoadBalancerStatsCardProps> {
    render() {
        return (
            <div className="load-balancer-metric">
                <div className="metric-heading">
                    <span>{this.props.titleText}</span>
                    {this.props.icon}
                </div>
                <div className="metric-value">{this.props.titleNumber}</div>
                <div className="metric-description">
                    {this.props.text1} {this.props.text2}
                </div>
            </div>
        )
    }
}

export default class LoadBalancerStats extends ApiComponent<
    {},
    { apiData: any; isLoading: boolean }
> {
    private updateApiInterval: any

    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
            isLoading: true,
        }
    }

    updateApi() {
        const self = this
        self.setState({ isLoading: !self.state.apiData }) // set to true just the first time
        this.apiManager
            .getLoadBalancerInfo()
            .then(function (data) {
                self.setState({ apiData: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) {
            super.componentWillUnmount()
        }
        if (this.updateApiInterval) {
            clearInterval(this.updateApiInterval)
        }
    }

    componentDidMount() {
        const self = this
        this.updateApi()
        this.updateApiInterval = setInterval(function () {
            self.updateApi()
        }, 20000)
    }

    render() {
        if (!!this.state.isLoading) {
            return <CenteredSpinner />
        }

        if (!this.state.apiData) {
            return <ErrorRetry />
        }

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 24 }}>
                        <Card
                            title={localize(
                                'load_balancer_stats.title',
                                'Load Balancer Stats'
                            )}
                        >
                            <Row gutter={[16, 16]} justify="center">
                                <Col xs={{ span: 12 }} lg={{ span: 6 }}>
                                    <Tooltip
                                        title={localize(
                                            'load_balancer_stats.total_requests_tooltip',
                                            'Constantly going up as refreshing the values'
                                        )}
                                    >
                                        <div>
                                            <LoadBalancerStatsCard
                                                icon={<Icons.GlobalOutlined />}
                                                titleText={localize(
                                                    'load_balancer_stats.total_requests',
                                                    'Total Requests'
                                                )}
                                                titleNumber={`${this.state.apiData.total}`}
                                                text1={``}
                                                text2={``}
                                            />
                                        </div>
                                    </Tooltip>
                                </Col>
                                <Col xs={{ span: 12 }} lg={{ span: 6 }}>
                                    <LoadBalancerStatsCard
                                        icon={<Icons.ClusterOutlined />}
                                        titleText={localize(
                                            'load_balancer_stats.active_connections',
                                            'Active Connections'
                                        )}
                                        titleNumber={`${this.state.apiData.activeConnections}`}
                                        text1={`${this.state.apiData.handled} handled`}
                                        text2={`${this.state.apiData.accepted} accepted`}
                                    />
                                </Col>
                                <Col xs={{ span: 12 }} lg={{ span: 6 }}>
                                    <LoadBalancerStatsCard
                                        icon={<Icons.SyncOutlined />}
                                        titleText={localize(
                                            'load_balancer_stats.active_requests',
                                            'Active Requests'
                                        )}
                                        titleNumber={`${
                                            this.state.apiData.reading +
                                            this.state.apiData.writing
                                        }`}
                                        text1={
                                            `${this.state.apiData.reading} ` +
                                            localize(
                                                'load_balancer_stats.reading_requests',
                                                'reading'
                                            )
                                        }
                                        text2={
                                            `${this.state.apiData.writing} ` +
                                            localize(
                                                'load_balancer_stats.writing_requests',
                                                'writing'
                                            )
                                        }
                                    />
                                </Col>
                                <Col xs={{ span: 12 }} lg={{ span: 6 }}>
                                    <LoadBalancerStatsCard
                                        icon={<Icons.ClockCircleOutlined />}
                                        titleText={localize(
                                            'load_balancer_stats.waiting_requests',
                                            'Waiting Requests'
                                        )}
                                        titleNumber={`${this.state.apiData.waiting}`}
                                        text1={`  `}
                                        text2={`  `}
                                    />
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}
