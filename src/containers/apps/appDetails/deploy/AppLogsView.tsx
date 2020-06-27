import {
    DownCircleOutlined,
    InfoCircleOutlined,
    MenuFoldOutlined,
    UpCircleOutlined,
} from '@ant-design/icons'
import { Row, Tooltip } from 'antd'
import React from 'react'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import ClickableLink from '../../../global/ClickableLink'
import NewTabLink from '../../../global/NewTabLink'

export default class AppLogsView extends ApiComponent<
    {
        appName: string
    },
    {
        expandedLogs: boolean
        appLogsStringified: string
        isWrapped: boolean
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isWrapped: true,
            expandedLogs: true,
            appLogsStringified: '',
        }
    }

    fetchLogs() {
        const self = this

        // See https://docs.docker.com/engine/api/v1.30/#operation/ContainerAttach for logs headers
        const separators = [
            '00000000',
            '01000000',
            '02000000',
            '03000000', // This is not in the Docker docs, but can actually happen when the log stream is broken https://github.com/caprover/caprover/issues/366
        ]
        const ansiRegex = Utils.getAnsiColorRegex()
        this.apiManager
            .fetchAppLogsInHex(this.props.appName)
            .then(function (logInfo: { logs: string }) {
                const logsProcessed = logInfo.logs
                    .split(new RegExp(separators.join('|'), 'g'))
                    .map((rawRow) => {
                        let time = 0

                        let textUtf8 = Utils.convertHexStringToUtf8(rawRow)

                        try {
                            time = new Date(textUtf8.substring(0, 30)).getTime()
                        } catch (err) {
                            // ignore... it's just a failure in fetching logs. Ignore to avoid additional noise in console
                        }

                        return {
                            text: textUtf8,
                            time: time,
                        }
                    })
                    .sort((a, b) =>
                        a.time > b.time ? 1 : b.time > a.time ? -1 : 0
                    )
                    .map((a) => {
                        return a.text
                    })
                    .join('')
                    .replace(ansiRegex, '')

                if (logsProcessed === self.state.appLogsStringified) {
                    return
                }

                const firstLogs = !self.state.appLogsStringified

                let textareaNow = document.getElementById('applogs-text-id')
                // Almost at the bottom. So keep the scroll at the bottom. Otherwise, user, may have manually scrolled up. Respect the user!
                const shouldScrollToBottom =
                    firstLogs ||
                    (!!textareaNow &&
                        Math.abs(
                            textareaNow.scrollTop -
                                (textareaNow.scrollHeight -
                                    textareaNow.offsetHeight)
                        ) < 100)

                self.setState({ appLogsStringified: logsProcessed })

                if (shouldScrollToBottom)
                    setTimeout(function () {
                        let textarea = document.getElementById(
                            'applogs-text-id'
                        )
                        if (textarea) textarea.scrollTop = textarea.scrollHeight
                    }, 100)
            })
            .catch(function (error) {
                console.log(error)
                self.setState({
                    appLogsStringified: 'fetching app log failed...',
                })
            })
            .then(function () {
                setTimeout(() => {
                    if (!self.willUnmountSoon) {
                        self.fetchLogs()
                    }
                }, 2200) // Just a random number to avoid hitting at the same time as build log fetch!
            })
    }

    componentDidMount() {
        const self = this
        self.fetchLogs()
    }

    onExpandLogClicked() {
        this.setState({ expandedLogs: !this.state.expandedLogs })
    }

    render() {
        const self = this
        return (
            <div>
                <div style={{ height: 20 }} />

                <div>
                    <div>
                        <Row justify="space-between" align="middle">
                            <span>
                                <Row justify="start" align="middle">
                                    <span>
                                        <ClickableLink
                                            onLinkClicked={() => {
                                                self.onExpandLogClicked()
                                            }}
                                        >
                                            <h4 className="unselectable-span">
                                                {this.state.expandedLogs ? (
                                                    <UpCircleOutlined />
                                                ) : (
                                                    <DownCircleOutlined />
                                                )}
                                                &nbsp;&nbsp;
                                                {!this.state.expandedLogs
                                                    ? 'View'
                                                    : 'Hide'}{' '}
                                                App Logs
                                            </h4>
                                        </ClickableLink>
                                    </span>

                                    <span
                                        style={{
                                            marginLeft: 20,
                                            paddingBottom: 3,
                                        }}
                                    >
                                        <Tooltip title="View full application logs (not truncated)">
                                            <NewTabLink url="https://caprover.com/docs/troubleshooting.html#how-to-view-my-applications-log">
                                                <InfoCircleOutlined />
                                            </NewTabLink>
                                        </Tooltip>
                                    </span>
                                </Row>
                            </span>
                            <span
                                className={
                                    this.state.expandedLogs
                                        ? ''
                                        : 'hide-on-demand'
                                }
                            >
                                <ClickableLink
                                    onLinkClicked={() => {
                                        self.setState({
                                            isWrapped: !self.state.isWrapped,
                                        })
                                    }}
                                >
                                    <h4 className="unselectable-span">
                                        <MenuFoldOutlined />
                                        &nbsp;&nbsp;{' '}
                                        {this.state.isWrapped
                                            ? "Don't"
                                            : ''}{' '}
                                        wrap logs &nbsp;&nbsp;
                                    </h4>
                                </ClickableLink>
                            </span>
                        </Row>
                    </div>

                    <div
                        className={
                            this.state.expandedLogs ? '' : 'hide-on-demand'
                        }
                        style={{ padding: 5 }}
                    >
                        <textarea
                            id="applogs-text-id"
                            className="logs-output"
                            style={{
                                whiteSpace: self.state.isWrapped
                                    ? 'pre-line'
                                    : 'pre',
                            }}
                            value={self.state.appLogsStringified}
                            readOnly
                        />
                    </div>
                </div>
            </div>
        )
    }
}
