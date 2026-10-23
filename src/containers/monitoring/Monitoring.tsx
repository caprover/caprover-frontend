import { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import { refreshDiskUsage } from '../../redux/actions/DiskUsageActions'
import DiskUsage from './DiskUsage'
import GoAccessInfo from './GoAccessInfo'
import LoadBalancerStats from './LoadBalancerStats'
import NetDataInfo from './NetDataInfo'

interface MonitoringProps extends RouteComponentProps<any> {
    diskUsage: DiskUsageViewState
    refreshDiskUsage: () => void
}

export class Monitoring extends Component<MonitoringProps> {
    componentDidMount() {
        if (!this.props.diskUsage.isLoading) {
            this.props.refreshDiskUsage()
        }
    }

    render() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '50px',
                }}
            >
                <DiskUsage
                    diskUsage={this.props.diskUsage}
                    history={this.props.history}
                    refreshDiskUsage={this.props.refreshDiskUsage}
                />
                <LoadBalancerStats />
                <NetDataInfo />
                <GoAccessInfo />
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        diskUsage: state.globalReducer.diskUsage,
    }
}

export default connect(mapStateToProps, {
    refreshDiskUsage,
})(Monitoring)
