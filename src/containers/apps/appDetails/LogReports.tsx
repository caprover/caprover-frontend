import { Component } from 'react'
import { AppDetailsTabProps } from './AppDetails'

interface GoAccessReport {
    name: string
    mtime: string
    size: number
    url: string
}
interface LogReportState {
    reportList: GoAccessReport[]
}
export default class LogReports extends Component<
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
        return (
            <div>
                <h2>Logs</h2>
                {this.state.reportList.map((r) => (
                    <p>
                        <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                width: this.props.isMobile ? '100%' : 'auto',
                            }}
                        >
                            {r.name}
                        </a>
                    </p>
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
