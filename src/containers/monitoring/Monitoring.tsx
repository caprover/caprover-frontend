import { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import { localize } from '../../utils/Language'
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
            <div className="monitoring-page">
                <div className="page-heading">
                    <h1>{localize('menu_item.monitoring', 'Monitoring')}</h1>
                    <p>
                        {localize(
                            'monitoring.subtitle',
                            'Resource usage, traffic, and system health.'
                        )}
                    </p>
                </div>
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
