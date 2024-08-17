import { Tooltip } from 'antd'
import moment from 'moment'
import { Component } from 'react'

export default class Timestamp extends Component<{ timestamp: string }, {}> {
    render() {
        const timestamp = this.props.timestamp
        return (
            <Tooltip title={moment(new Date(timestamp)).fromNow()}>
                <span>
                    {moment(new Date(timestamp)).format('M/D/YY, h:mma')}
                </span>
            </Tooltip>
        )
    }
}
