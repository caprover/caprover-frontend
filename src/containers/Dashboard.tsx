import { connect } from 'react-redux'
import { Redirect, RouteComponentProps } from 'react-router'
import ReduxState from '../models/ReduxState'
import { SetupStatus } from '../models/SetupStatus'
import AppConstants from '../utils/AppConstants'
import CenteredSpinner from './global/CenteredSpinner'

interface DashboardProps extends RouteComponentProps<any> {
    setupStatus: SetupStatus
    setupDismissed: boolean
}

export function Dashboard({
    setupStatus,
    setupDismissed,
    location,
}: DashboardProps) {
    const query = new URLSearchParams(location.search)
    if (setupStatus === SetupStatus.Loading) return <CenteredSpinner />
    if (
        setupStatus === SetupStatus.Complete &&
        !!query.get(AppConstants.REDIRECT_TO_APPS_IF_READY_REQ_PARAM)
    ) {
        return <Redirect to="/apps" />
    }

    return (
        <Redirect
            to={
                setupDismissed || setupStatus === SetupStatus.Complete
                    ? '/overview'
                    : '/setup'
            }
        />
    )
}

function mapStateToProps(state: ReduxState) {
    return {
        setupStatus: state.globalReducer.setupStatus,
        setupDismissed: state.globalReducer.setupDismissed,
    }
}

export default connect(mapStateToProps)(Dashboard)
