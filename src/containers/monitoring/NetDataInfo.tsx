import { AreaChartOutlined, PoweroffOutlined } from '@ant-design/icons'
import { Button, Card, Col, message, Row } from 'antd'
import React from 'react'
import { connect } from 'react-redux'
import { IMobileComponent } from '../../models/ContainerProps'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import NetDataDescription from './NetDataDescription'
import NetDataSettingsForm from './NetDataSettingsForm'

class NetDataInfo extends ApiComponent<
    {
        isMobile: boolean
    },
    { apiData: any; isLoading: boolean }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
            isLoading: true,
        }
    }

    componentDidMount() {
        this.refetchData()
    }

    refetchData() {
        const self = this
        self.setState({ isLoading: true, apiData: undefined })
        return this.apiManager
            .getNetDataInfo()
            .then(function (data) {
                self.setState({ apiData: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    toggleNetDataClicked(isActivated: boolean) {
        const netDataInfo = Utils.copyObject(this.state.apiData)
        netDataInfo.isEnabled = !!isActivated
        this.onUpdateNetDataClicked(netDataInfo)
    }

    onUpdateNetDataClicked(netDataInfo: any) {
        const self = this
        self.setState({ isLoading: true })
        return this.apiManager
            .updateNetDataInfo(netDataInfo)
            .then(function () {
                message.success(
                    netDataInfo.isEnabled
                        ? 'NetData is started and updated!'
                        : 'NetData has stopped!'
                )
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.refetchData()
            })
    }

    render() {
        const self = this

        if (this.state.isLoading) {
            return <CenteredSpinner />
        }

        if (!this.state.apiData) {
            return <ErrorRetry />
        }

        const netDataInfo = this.state.apiData

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                        <Card title="NetData Monitoring Tool">
                            <NetDataDescription />
                            <hr />
                            <div style={{ height: 30 }} />
                            <div
                                className={
                                    netDataInfo.isEnabled
                                        ? 'hide-on-demand'
                                        : ''
                                }
                            >
                                <Row justify="end">
                                    <Button
                                        onClick={() =>
                                            self.toggleNetDataClicked(true)
                                        }
                                        type="primary"
                                    >
                                        <span>
                                            Start NetData Engine &nbsp;
                                            <PoweroffOutlined />
                                        </span>
                                    </Button>
                                </Row>
                            </div>

                            <div
                                className={
                                    !netDataInfo.isEnabled
                                        ? 'hide-on-demand'
                                        : ''
                                }
                            >
                                <Row justify="end" gutter={20}>
                                    <Button
                                        style={{
                                            marginRight: self.props.isMobile
                                                ? 0
                                                : 40,
                                            marginBottom: self.props.isMobile
                                                ? 8
                                                : 0,
                                        }}
                                        block={self.props.isMobile}
                                        onClick={() =>
                                            self.toggleNetDataClicked(false)
                                        }
                                        danger
                                    >
                                        <span>
                                            Turn NetData Off &nbsp;
                                            <PoweroffOutlined />
                                        </span>
                                    </Button>
                                    <a
                                        type="submit"
                                        href={`//${netDataInfo.netDataUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            width: this.props.isMobile
                                                ? '100%'
                                                : 'auto',
                                        }}
                                    >
                                        <Button
                                            block={self.props.isMobile}
                                            // onClick={() => self.onStartNetDataClicked()}
                                            type="primary"
                                        >
                                            <span>
                                                Open NetData &nbsp;
                                                <AreaChartOutlined />
                                            </span>
                                        </Button>
                                    </a>
                                </Row>
                                <div style={{ height: 30 }} />
                                <hr />
                                <div style={{ height: 30 }} />
                                <NetDataSettingsForm
                                    updateModel={(netDataInfo) => {
                                        self.setState({ apiData: netDataInfo })
                                    }}
                                    netDataInfo={netDataInfo}
                                />

                                <br />

                                <Row justify="end">
                                    <Button
                                        type="primary"
                                        onClick={() =>
                                            self.onUpdateNetDataClicked(
                                                Utils.copyObject(
                                                    self.state.apiData
                                                )
                                            )
                                        }
                                    >
                                        Update NetData
                                    </Button>
                                </Row>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect<IMobileComponent, any, any>(
    mapStateToProps,
    undefined
)(NetDataInfo)
