import React, { Component } from 'react'
import { RouteComponentProps } from 'react-router'
import ApiManager from '../api/ApiManager'
import AppConstants from '../utils/AppConstants'

export default class LoggedInCatchAll extends Component<
    RouteComponentProps<any>
> {
    componentDidMount() {
        if (!ApiManager.isLoggedIn()) {
            this.props.history.push('/login')
        } else {
            this.props.history.push(
                `/dashboard?${AppConstants.REDIRECT_TO_APPS_IF_READY_REQ_PARAM}=true`
            )
        }
    }

    render() {
        return <div />
    }
}
