import { Tooltip } from 'antd'
import { Component } from 'react'
import Utils from '../../utils/Utils'

export default class Timestamp extends Component<{ timestamp: string }, {}> {
    render() {
        const timestamp = this.props.timestamp

        return (
            <Tooltip title={Utils.getRelativeDateTime(timestamp)}>
                <span>{Utils.getLocalizedDateTime(timestamp)}</span>
            </Tooltip>
        )
    }
}
