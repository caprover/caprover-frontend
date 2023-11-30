import {
    DownCircleOutlined,
    LoadingOutlined,
    UpCircleOutlined,
} from '@ant-design/icons'
import { Alert, Input, Row, Spin } from 'antd'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'
import ClickableLink from '../../../global/ClickableLink'

export default class BuildLogsView extends ApiComponent<
    {
        appName: string
        onAppBuildFinished: () => void
        buildLogRecreationId: string
    },
    {
        isAppBuilding: boolean
        expandedLogs: boolean
        buildLogs: string
        lastLineNumberPrinted: number
    }
> {
    private fetchBuildLogsInterval: any
    constructor(props: any) {
        super(props)
        this.state = {
            isAppBuilding: false,
            expandedLogs: !!this.props.buildLogRecreationId,
            buildLogs: '',
            lastLineNumberPrinted: -10000,
        }
    }

    componentWillUnmount() {
        // @ts-ignore
        if (super.componentWillUnmount) super.componentWillUnmount()
        if (this.fetchBuildLogsInterval) {
            clearInterval(this.fetchBuildLogsInterval)
        }
    }

    fetchBuildLogs() {
        const self = this
        this.apiManager
            .fetchBuildLogs(this.props.appName)
            .then(function (logInfo: {
                isAppBuilding: boolean
                isBuildFailed: boolean
                logs: {
                    firstLineNumber: number
                    lines: string[]
                }
            }) {
                if (self.state.isAppBuilding && !logInfo.isAppBuilding) {
                    // App was building but not anymore
                    self.props.onAppBuildFinished()
                }

                self.setState({ isAppBuilding: logInfo.isAppBuilding })
                if (logInfo.isAppBuilding) {
                    // forcefully expanding the view such that when building finishes it doesn't collapses automatically
                    self.setState({ expandedLogs: true })
                }

                let lines = logInfo.logs.lines
                let firstLineNumberOfLogs = logInfo.logs.firstLineNumber
                let firstLinesToPrint = 0
                if (firstLineNumberOfLogs > self.state.lastLineNumberPrinted) {
                    if (firstLineNumberOfLogs < 0) {
                        // This is the very first fetch, probably firstLineNumberOfLogs is around -50
                        firstLinesToPrint = -firstLineNumberOfLogs
                    } else {
                        self.setState({
                            buildLogs: `${self.state.buildLogs}[[ TRUNCATED ]]\n`,
                        })
                    }
                } else {
                    firstLinesToPrint =
                        self.state.lastLineNumberPrinted - firstLineNumberOfLogs
                }

                self.setState({
                    lastLineNumberPrinted: firstLineNumberOfLogs + lines.length,
                })

                let lineAdded = false

                let buildLogs = self.state.buildLogs
                const ansiRegex = Utils.getAnsiColorRegex()
                for (let i = firstLinesToPrint; i < lines.length; i++) {
                    const newLine = (lines[i] || '')
                        .trim()
                        .replace(ansiRegex, '')
                    buildLogs += newLine + '\n'

                    lineAdded = true
                }
                self.setState({ buildLogs: buildLogs })

                if (lineAdded) {
                    setTimeout(function () {
                        let textarea =
                            document.getElementById('buildlog-text-id')
                        if (textarea) textarea.scrollTop = textarea.scrollHeight
                    }, 100)
                }
            })
            .catch(Toaster.createCatcher())
    }

    componentDidMount() {
        const self = this
        this.fetchBuildLogs()
        this.fetchBuildLogsInterval = setInterval(function () {
            self.fetchBuildLogs()
        }, 2000)
    }

    onExpandLogClicked() {
        this.setState({ expandedLogs: !this.state.expandedLogs })
    }

    render() {
        const self = this
        return (
            <div>
                <Row>
                    <div
                        style={{
                            width: '100%',
                        }}
                        className={
                            this.state.isAppBuilding ? '' : 'hide-on-demand'
                        }
                    >
                        <Alert
                            message={
                                <span>
                                    &nbsp;&nbsp;
                                    <Spin
                                        indicator={
                                            <LoadingOutlined
                                                style={{ fontSize: 24 }}
                                                spin
                                            />
                                        }
                                        size="default"
                                    />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                                    Building the image. This might take a few
                                    minutes...
                                </span>
                            }
                            type="info"
                        />
                    </div>
                </Row>

                <div style={{ height: 20 }} />

                <div>
                    <div>
                        <ClickableLink
                            onLinkClicked={() => {
                                self.onExpandLogClicked()
                            }}
                        >
                            <span className="unselectable-span">
                                {this.state.expandedLogs ? (
                                    <UpCircleOutlined />
                                ) : (
                                    <DownCircleOutlined />
                                )}
                                &nbsp;&nbsp;
                                {!this.state.expandedLogs
                                    ? 'View'
                                    : 'Hide'}{' '}
                                Build Logs
                            </span>
                        </ClickableLink>
                    </div>

                    <div
                        className={
                            this.state.isAppBuilding || this.state.expandedLogs
                                ? ''
                                : 'hide-on-demand'
                        }
                        style={{ padding: 5 }}
                    >
                        <Input.TextArea
                            id="buildlog-text-id"
                            className="logs-output"
                            style={{
                                whiteSpace: 'pre',
                            }}
                            readOnly
                            value={self.state.buildLogs}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
