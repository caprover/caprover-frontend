import { Tooltip } from 'antd'
import moment from 'moment'
import React, { Component } from 'react'

export default class Timestamp extends Component<{ timestamp: string }, {}> {
    render() {
        const timestamp = this.props.timestamp
        return (
            <Tooltip title={moment(new Date(timestamp)).fromNow()}>
                <span>{new Date(timestamp).toLocaleString()}</span>
            </Tooltip>
        )
    }
}
