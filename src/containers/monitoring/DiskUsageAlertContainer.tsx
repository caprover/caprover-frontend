import { Component } from 'react'
import { connect } from 'react-redux'
import { RouteComponentProps } from 'react-router'
import ApiManager from '../../api/ApiManager'
import DiskUsageViewState from '../../models/DiskUsageViewState'
import ReduxState from '../../models/ReduxState'
import { refreshDiskUsage } from '../../redux/actions/DiskUsageActions'
import { DiskUsageAlert } from './DiskUsage'

interface DiskUsageAlertContainerProps {
    diskUsage: DiskUsageViewState
    history: RouteComponentProps<any>['history']
    refreshDiskUsage: () => void
}

class DiskUsageAlertContainer extends Component<DiskUsageAlertContainerProps> {
    componentDidMount() {
        if (ApiManager.isLoggedIn()) {
            this.props.refreshDiskUsage()
        }
    }

    render() {
        return (
            <DiskUsageAlert
                diskUsage={this.props.diskUsage}
                history={this.props.history}
            />
        )
    }
}

function mapStateToProps(state: ReduxState) {
    return {
        diskUsage: state.globalReducer.diskUsage,
    }
}

export default connect(mapStateToProps, { refreshDiskUsage })(
    DiskUsageAlertContainer
)
