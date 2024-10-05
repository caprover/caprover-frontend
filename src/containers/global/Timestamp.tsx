import { Tooltip } from 'antd'
import moment from 'moment'
import { Component } from 'react'

export default class Timestamp extends Component<{ timestamp: string }, {}> {
    render() {
        const timestamp = this.props.timestamp
        return (
            <Tooltip title={moment(new Date(timestamp)).fromNow()}>
                <span>
                    {/* 'L' represents localized date format, 'LT' represents localized time format */}
                    {moment(new Date(timestamp)).format('L, LT')}
                </span>
            </Tooltip>
        )
    }
}
