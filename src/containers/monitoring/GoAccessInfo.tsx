import { PoweroffOutlined } from '@ant-design/icons'
import { Button, Card, Col, Row, message } from 'antd'
import { connect } from 'react-redux'
import { IMobileComponent } from '../../models/ContainerProps'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import GoAccessDescription from './GoAccessDescription'
import GoAccessSettingsForm from './GoAccessSettingsForm'

class GoAccessInfo extends ApiComponent<
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
            .getGoAccessInfo()
            .then(function (data) {
                self.setState({ apiData: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    toggleClicked(isActivated: boolean) {
        const goAccessInfo = Utils.copyObject(this.state.apiData)
        goAccessInfo.isEnabled = !!isActivated
        this.onUpdateGoAccessClicked(goAccessInfo)
    }

    onUpdateGoAccessClicked(goAccessInfo: any) {
        const self = this
        self.setState({ isLoading: true })
        return this.apiManager
            .updateGoAccessInfo(goAccessInfo)
            .then(function () {
                message.success(
                    goAccessInfo.isEnabled
                        ? localize('goaccess.started', 'GoAccess is started!')
                        : localize('goaccess.stopped', 'GoAccess has stopped')
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

        const goAccessInfo = this.state.apiData

        return (
            <div>
                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 18 }}>
                        <Card
                            title={localize(
                                'goaccess.log_analyzer',
                                'GoAccess Log Analyzer'
                            )}
                        >
                            <GoAccessDescription />
                            <hr />
                            <div style={{ height: 30 }} />
                            <div
                                className={
                                    goAccessInfo.isEnabled
                                        ? 'hide-on-demand'
                                        : ''
                                }
                            >
                                <Row justify="end">
                                    <Button
                                        onClick={() => self.toggleClicked(true)}
                                        type="primary"
                                    >
                                        <span>
                                            {localize(
                                                'goaccess.start_goaccess',
                                                'Start GoAccess'
                                            )}{' '}
                                            &nbsp;
                                            <PoweroffOutlined />
                                        </span>
                                    </Button>
                                </Row>
                            </div>

                            <div
                                className={
                                    !goAccessInfo.isEnabled
                                        ? 'hide-on-demand'
                                        : ''
                                }
                            >
                                <Row justify="space-between">
                                    <p>
                                        <b>
                                            {localize(
                                                'goaccess.logs_location',
                                                'View access logs on the app details page'
                                            )}
                                        </b>
                                    </p>
                                    <Button
                                        style={{
                                            marginInlineEnd: self.props.isMobile
                                                ? 0
                                                : 10,
                                            marginBottom: self.props.isMobile
                                                ? 8
                                                : 0,
                                        }}
                                        block={self.props.isMobile}
                                        onClick={() =>
                                            self.toggleClicked(false)
                                        }
                                        danger
                                    >
                                        <span>
                                            {localize(
                                                'goaccess.stop_goaccess',
                                                'Stop GoAccess'
                                            )}{' '}
                                            &nbsp;
                                            <PoweroffOutlined />
                                        </span>
                                    </Button>
                                </Row>
                                <div style={{ height: 30 }} />
                                <hr />
                                <div style={{ height: 30 }} />
                                <GoAccessSettingsForm
                                    goAccessInfo={goAccessInfo}
                                    saveSettings={(goAccessInfo) => {
                                        self.onUpdateGoAccessClicked(
                                            goAccessInfo
                                        )
                                    }}
                                />
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
)(GoAccessInfo)
