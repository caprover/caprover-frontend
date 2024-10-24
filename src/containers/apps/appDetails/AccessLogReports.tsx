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
}
export default class AccessLogReports extends Component<
    AppDetailsTabProps,
    LogReportState
> {
    constructor(props: any) {
        super(props)
        this.state = {
            reportList: [],
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px' }}>
                {groupList.map(({ key, reports }) => (
                    <div>
                        <h3>{key}</h3>
                        {Object.entries(
                            reports.reduce(
                                (
                                    acc: { [key: string]: GoAccessReport[] },
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
                            <div>
                                <h4>{domainName}</h4>
                                {reports.map((r) => (
                                    <p>
                                        <a
                                            href={r.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            {r.name}
                                        </a>
                                    </p>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
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
                console.log('Got response', { response })
                self.setState({ reportList: response })
                this.props.setLoading(false)
            })
    }
}
