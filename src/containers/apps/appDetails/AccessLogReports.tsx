import { Button, Modal } from 'antd'
import { Component } from 'react'
import { AppDetailsTabProps } from './AppDetails'

interface GoAccessReport {
    name: string
    lastModifiedTime: string
    domainName: string
    url: string
}
interface LogReportState {
    reportList: GoAccessReport[]
    reportOpen: string | undefined
    reportHtml: string | undefined
}
export default class AccessLogReports extends Component<
    AppDetailsTabProps,
    LogReportState
> {
    constructor(props: any) {
        super(props)
        this.state = {
            reportList: [],
            reportOpen: undefined,
            reportHtml: undefined,
        }
    }
    render() {
        const groupedReports = this.state.reportList.reduce(
            (acc: { [key: string]: GoAccessReport[] }, report) => {
                const date = new Date(report.lastModifiedTime)
                const year = date.getFullYear()
                const month = date.toLocaleDateString(undefined, {
                    month: 'long',
                })
                const key = `${year} - ${month}`

                if (!acc[key]) {
                    acc[key] = []
                }

                acc[key].push(report)

                return acc
            },
            {}
        )
        const groupList = Object.entries(groupedReports)
            .map(([key, reports]) => ({
                key,
                reports,
                time: new Date(reports[0].lastModifiedTime).getTime(),
            }))
            .sort((a, b) => b.time - a.time)

        return (
            <>
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 3fr',
                        gap: '20px',
                    }}
                >
                    {groupList.map(({ key, reports }) => (
                        <div style={{ display: 'contents' }} key={key}>
                            <h3>{key}</h3>
                            <div
                                style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    flexDirection: 'row',
                                    gap: '40px',
                                }}
                            >
                                {Object.entries(
                                    reports.reduce(
                                        (
                                            acc: {
                                                [key: string]: GoAccessReport[]
                                            },
                                            report
                                        ) => {
                                            if (!acc[report.domainName]) {
                                                acc[report.domainName] = []
                                            }
                                            acc[report.domainName].push(report)
                                            return acc
                                        },
                                        {}
                                    )
                                ).map(([domainName, reports]) => (
                                    <div key={`${key}-${domainName}`}>
                                        <h4>{domainName}</h4>
                                        {reports.map((r) => (
                                            <p key={r.name}>
                                                <Button
                                                    onClick={() =>
                                                        this.onReportClick(
                                                            r.name,
                                                            r.url
                                                        )
                                                    }
                                                >
                                                    {r.name}
                                                </Button>
                                            </p>
                                        ))}
                                    </div>
                                ))}
                            </div>
                            <hr
                                style={{
                                    gridColumn: '1 / 3',
                                    height: '1px',
                                    width: '100%',
                                    opacity: 0.2,
                                }}
                            />
                        </div>
                    ))}
                </div>

                <Modal
                    closable={true}
                    footer={<div />}
                    title={this.state.reportOpen}
                    open={this.state.reportOpen !== undefined}
                    onCancel={() => this.onModalClose()}
                    loading={!this.state.reportHtml}
                    width="90vw"
                    style={{ top: 20 }}
                >
                    {this.state.reportHtml && (
                        <iframe
                            title="GoAccess"
                            style={{
                                width: '100%',
                                minHeight: 'calc(85vh - 20px)',
                            }}
                            srcDoc={this.state.reportHtml}
                        ></iframe>
                    )}
                </Modal>
            </>
        )
    }

    componentDidMount() {
        this.reFetchData()
    }

    reFetchData() {
        const self = this
        this.props.setLoading(true)

        this.props.apiManager
            .getGoAccessReports(this.props.apiData!.appDefinition.appName!)
            .then((response) => {
                self.setState({ reportList: response })
                this.props.setLoading(false)
            })
    }

    onReportClick(reportName: string, reportUrl: string) {
        this.setState({ reportOpen: reportName })

        this.props.apiManager.getGoAccessReport(reportUrl).then((report) => {
            this.setState({ reportHtml: report })
        })
    }

    onModalClose() {
        this.setState({ reportOpen: undefined, reportHtml: undefined })
    }
}
