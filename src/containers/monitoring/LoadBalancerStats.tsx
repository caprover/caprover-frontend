import * as Icons from '@ant-design/icons'
import { Avatar, Card, Col, Row, Tooltip } from 'antd'
import React, { Component } from 'react'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'

class LoadBalancerStatsCard extends Component<any, any> {
    render() {
        return (
            <div
                className="inner-card"
                style={{
                    height: 240,
                    overflow: 'hidden',
                    borderRadius: 5,
                    marginBottom: 8,
                }}
            >
                <div style={{ textAlign: 'center', margin: 16 }}>
                    <Avatar
                        style={{ backgroundColor: this.props.color }}
                        size={64}
                        icon={this.props.icon}
                    />
                </div>
                <div style={{ textAlign: 'center' }}>
                    <h4>
                        {this.props.titleText}
                        <br />
                        {this.props.titleNumber}
                    </h4>
                    <p>
                        {this.props.text1}
                        <br />
                        {this.props.text2}
                    </p>
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
                    <Col xs={{ span: 23 }} lg={{ span: 22 }}>
                        <Card title="Load Balancer Stats">
                            <Row gutter={10} justify="center">
                                <Col xs={{ span: 24 }} lg={{ span: 6 }}>
                                    <Tooltip title="Constantly going up as refreshing the values">
                                        <div>
                                            <LoadBalancerStatsCard
                                                icon={<Icons.GlobalOutlined />}
                                                color="#2361ae"
                                                titleText="Total Requests"
                                                titleNumber={`${this.state.apiData.total}`}
                                                text1={``}
                                                text2={``}
                                            />
                                        </div>
                                    </Tooltip>
                                </Col>
                                <Col xs={{ span: 24 }} lg={{ span: 6 }}>
                                    <LoadBalancerStatsCard
                                        icon={<Icons.ClusterOutlined />}
                                        color="#23ae89"
                                        titleText="Active Connections"
                                        titleNumber={`${this.state.apiData.activeConnections}`}
                                        text1={`${this.state.apiData.handled} handled`}
                                        text2={`${this.state.apiData.accepted} accepted`}
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} lg={{ span: 6 }}>
                                    <LoadBalancerStatsCard
                                        icon={<Icons.SyncOutlined />}
                                        color="#d3a938"
                                        titleText="Active Requests"
                                        titleNumber={`${
                                            this.state.apiData.reading +
                                            this.state.apiData.writing
                                        }`}
                                        text1={`${this.state.apiData.reading} reading`}
                                        text2={`${this.state.apiData.writing} writing`}
                                    />
                                </Col>
                                <Col xs={{ span: 24 }} lg={{ span: 6 }}>
                                    <LoadBalancerStatsCard
                                        icon={<Icons.ClockCircleOutlined />}
                                        color="#ae2323"
                                        titleText="Waiting Requests"
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
