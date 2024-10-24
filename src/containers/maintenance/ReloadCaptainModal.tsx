import { Modal } from 'antd'
import { Component, PropsWithChildren } from 'react'
import { localize } from '../../utils/Language'

export default class ReloadCaptainModal extends Component<
    PropsWithChildren<{
        isRefreshTimerActivated: boolean
    }>,
    { timeToRefresh: number }
> {
    private hasAlreadyActivated: boolean
    constructor(props: any) {
        super(props)
        this.hasAlreadyActivated = false
        this.state = {
            timeToRefresh: 0,
        }
    }

    startTimer() {
        const self = this
        self.setState({ timeToRefresh: 60 })
        setInterval(function () {
            if (self.state.timeToRefresh < 2) {
                window.location.reload()
                return
            }
            self.setState({ timeToRefresh: self.state.timeToRefresh - 1 })
        }, 1000)
    }

    render() {
        const self = this
        if (self.props.isRefreshTimerActivated && !this.hasAlreadyActivated) {
            this.hasAlreadyActivated = true
            setTimeout(() => self.startTimer(), 10)
        }

        return (
            <div>
                <Modal
                    closable={false}
                    footer={<div />}
                    title={localize(
                        'settings.update_process_started',
                        'Update Process Started'
                    )}
                    open={self.state.timeToRefresh > 0}
                >
                    <div>
                        {self.props.children}
                        <p>
                            <b>
                                {localize(
                                    'settings.time_to_refresh',
                                    'Time to Refresh: '
                                )}{' '}
                            </b>
                            {this.state.timeToRefresh}
                        </p>
                    </div>
                </Modal>
            </div>
        )
    }
}
