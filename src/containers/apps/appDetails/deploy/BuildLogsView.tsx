import {
    DownCircleOutlined,
    LoadingOutlined,
    UpCircleOutlined,
} from '@ant-design/icons'
import { Alert, Button, Input, Spin } from 'antd'
import { localize } from '../../../../utils/Language'
import Toaster from '../../../../utils/Toaster'
import Utils from '../../../../utils/Utils'
import ApiComponent from '../../../global/ApiComponent'

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
            isAppBuilding: !!props.buildLogRecreationId,
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
                if (self.willUnmountSoon) return

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
        const { isAppBuilding, expandedLogs, buildLogs } = this.state
        return (
            <div className="deployment-build-logs">
                {isAppBuilding && (
                    <Alert
                        message={localize(
                            'apps.deploy_build_in_progress',
                            'Building the image. This might take a few minutes...'
                        )}
                        icon={<Spin indicator={<LoadingOutlined spin />} />}
                        showIcon
                        type="info"
                    />
                )}
                <Button
                    aria-expanded={isAppBuilding || expandedLogs}
                    aria-controls="buildlog-text-id"
                    disabled={isAppBuilding}
                    icon={
                        expandedLogs ? (
                            <UpCircleOutlined />
                        ) : (
                            <DownCircleOutlined />
                        )
                    }
                    onClick={() => this.onExpandLogClicked()}
                >
                    {expandedLogs
                        ? localize(
                              'apps.deploy_app_build_logs_hide',
                              'Hide Build Logs'
                          )
                        : localize(
                              'apps.deploy_app_build_logs_view',
                              'View Build Logs'
                          )}
                </Button>
                <div hidden={!isAppBuilding && !expandedLogs}>
                    <Input.TextArea
                        id="buildlog-text-id"
                        className="logs-output"
                        style={{ whiteSpace: 'pre' }}
                        readOnly
                        value={buildLogs}
                    />
                </div>
            </div>
        )
    }
}
