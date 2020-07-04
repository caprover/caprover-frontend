import { CloudDownloadOutlined } from '@ant-design/icons'
import { Alert, Button, Row } from 'antd'
import React from 'react'
import { IVersionInfo } from '../../models/IVersionInfo'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import ReloadCaptainModal from './ReloadCaptainModal'

export default class CheckUpdate extends ApiComponent<
    {
        isMobile: boolean
    },
    {
        versionInfo: IVersionInfo | undefined
        isRefreshTimerActivated: boolean
        isLoading: boolean
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            versionInfo: undefined,
            isRefreshTimerActivated: false,
            isLoading: true,
        }
    }

    componentDidMount() {
        const self = this
        self.setState({ isLoading: true })
        self.apiManager
            .getVersionInfo()
            .then(function (data) {
                self.setState({ versionInfo: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    onPerformUpdateClicked() {
        const self = this
        const versionInfo = this.state.versionInfo
        self.setState({ isLoading: true })
        self.apiManager
            .performUpdate(versionInfo!.latestVersion)
            .then(function () {
                self.setState({ isRefreshTimerActivated: true })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    render() {
        const self = this

        if (self.state.isLoading) {
            return <CenteredSpinner />
        }

        const versionInfo = this.state.versionInfo

        if (!versionInfo) {
            return <ErrorRetry />
        }

        return (
            <div>
                <p>
                    CapRover allows in-place updates to be installed. However,
                    always read the change logs before updating your CapRover.
                    There might be breaking changes that you need to be aware
                    of. The update usually takes around 60 seconds and your
                    CapRover may become unresponsive until the update process is
                    finished. Your apps will stay functional and responsive
                    during this time, except for a very short period of 10
                    seconds or less.
                </p>
                <br />
                <p>
                    <b>Current Version</b>: {versionInfo.currentVersion}
                </p>
                <p>
                    <b>Latest Stable Version</b>: {versionInfo.latestVersion}
                </p>
                <div>
                    <p
                        className={
                            versionInfo.changeLogMessage
                                ? 'pre-line-content'
                                : 'hide-on-demand'
                        }
                    >
                        {versionInfo.changeLogMessage}
                    </p>
                </div>
                <div className={versionInfo.canUpdate ? '' : 'hide-on-demand'}>
                    <Row justify="end">
                        <Button
                            type="primary"
                            block={this.props.isMobile}
                            onClick={() => this.onPerformUpdateClicked()}
                        >
                            <span>
                                <CloudDownloadOutlined />
                            </span>{' '}
                            &nbsp; Install Update
                        </Button>
                    </Row>
                </div>

                <div className={!versionInfo.canUpdate ? '' : 'hide-on-demand'}>
                    <Alert
                        message="Your CapRover is the latest version."
                        type="info"
                    />
                </div>

                <ReloadCaptainModal
                    isRefreshTimerActivated={self.state.isRefreshTimerActivated}
                >
                    <div>
                        <p>
                            Update takes about a minute to complete depending on
                            your server connection speed.
                        </p>
                        <p>
                            Your CapRover dashboard is not functional during the
                            update. Please wait until this page is refreshed
                            automatically.
                        </p>
                        <p>
                            You might see an nginx error briefly after the
                            update. But it will fix itself in a few seconds.
                        </p>

                        <br />
                        <br />
                    </div>
                </ReloadCaptainModal>
            </div>
        )
    }
}
