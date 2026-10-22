import { Component } from 'react'
import { DiskUsageViewState } from './DiskUsage'
import DiskUsage from './DiskUsage'
import GoAccessInfo from './GoAccessInfo'
import LoadBalancerStats from './LoadBalancerStats'
import NetDataInfo from './NetDataInfo'

interface MonitoringProps {
    diskUsage: DiskUsageViewState
    onOpenMaintenance: () => void
    onRefreshDiskUsage: () => void
}

export default class Monitoring extends Component<MonitoringProps> {
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
                    onOpenMaintenance={this.props.onOpenMaintenance}
                    onRefresh={this.props.onRefreshDiskUsage}
                />
                <LoadBalancerStats />
                <NetDataInfo />
                <GoAccessInfo />
            </div>
        )
    }
}
