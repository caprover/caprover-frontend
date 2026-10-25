import { Tooltip } from 'antd'
import { Component } from 'react'
import Utils from '../../utils/Utils'

export default class Timestamp extends Component<
    { timestamp: string; relative?: boolean },
    {}
> {
    render() {
        const timestamp = this.props.timestamp

        return (
            <Tooltip
                title={
                    this.props.relative
                        ? Utils.getLocalizedDateTime(timestamp)
                        : Utils.getRelativeDateTime(timestamp)
                }
            >
                <time dateTime={timestamp}>
                    {this.props.relative
                        ? Utils.getRelativeDateTime(timestamp)
                        : Utils.getLocalizedDateTime(timestamp)}
                </time>
            </Tooltip>
        )
    }
}
