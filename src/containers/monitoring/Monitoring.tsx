import { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import ReduxState from '../../models/ReduxState'
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
        this.props.refreshDiskUsage()
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

function mapStateToProps(state: ReduxState) {
    return {
        diskUsage: state.globalReducer.diskUsage,
    }
}

export default connect(mapStateToProps, {
    refreshDiskUsage,
})(Monitoring)
