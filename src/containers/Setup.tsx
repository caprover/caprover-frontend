import { Alert, Button } from 'antd'
import { Component } from 'react'
import { connect } from 'react-redux'
import { Redirect } from 'react-router'
import ReduxState from '../models/ReduxState'
import { SetupStatus } from '../models/SetupStatus'
import { dismissSetup, refreshSetup } from '../redux/actions/SetupActions'
import { localize } from '../utils/Language'
import CenteredSpinner from './global/CenteredSpinner'
import DomainsHttps from './settings/DomainsHttps'

interface SetupProps {
    setupStatus: SetupStatus
    setupDismissed: boolean
    dismissSetup: () => void
    refreshSetup: () => void
}

export class Setup extends Component<SetupProps> {
    render() {
        if (
            this.props.setupDismissed ||
            this.props.setupStatus === SetupStatus.Complete
        )
            return <Redirect to="/overview" />
        if (this.props.setupStatus === SetupStatus.Loading)
            return <CenteredSpinner />
        if (this.props.setupStatus === SetupStatus.Failed)
            return (
                <Alert
                    showIcon
                    type="warning"
                    message={localize(
                        'setup.status_unavailable',
                        'Setup status is unavailable.'
                    )}
                    action={
                        <Button onClick={this.props.refreshSetup}>
                            {localize('disk_usage.try_again', 'Try again')}
                        </Button>
                    }
                />
            )

        return (
            <div>
                <Alert
                    className="setup-dismissal"
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                    message={localize(
                        'setup.http_only',
                        'Using HTTP only? You can dismiss setup and continue configuring this server in Settings.'
                    )}
                    description={localize(
                        'setup.dismiss_scope',
                        'Dismissal is saved in this browser for this CapRover origin. Domains and HTTPS remain available in Settings.'
                    )}
                    action={
                        <Button onClick={this.props.dismissSetup}>
                            {localize('setup.dismiss', 'Dismiss Setup')}
                        </Button>
                    }
                />
                <DomainsHttps guided />
            </div>
        )
    }
}

function mapStateToProps(state: ReduxState) {
    return {
        setupStatus: state.globalReducer.setupStatus,
        setupDismissed: state.globalReducer.setupDismissed,
    }
}

export default connect(mapStateToProps, { dismissSetup, refreshSetup })(Setup)
