import { Component } from 'react'
import { localize } from '../../utils/Language'
import NewTabLink from '../global/NewTabLink'

export default class NetDataDescription extends Component {
    render() {
        return (
            <div>
                <p>
                    {localize(
                        'netdata.description_details',
                        'Netdata is one of the most popular and most powerful monitoring tools that provide a web interface. It is a system for distributed real-time performance and health monitoring. It provides unparalleled insights, in real-time, of everything happening on the system it runs (including applications such as web and database servers), using modern interactive web dashboards.'
                    )}
                    .
                </p>
                <p>
                    {localize(
                        'netdata.speed_efficiency',
                        'NetData is fast and efficient, designed to permanently run on all systems (physical & virtual servers, containers, IoT devices), without disrupting their core function. The current image of NetData embeded in CapRover uses a default configuration for statistics'
                    )}
                    <NewTabLink url="https://docs.netdata.cloud/docs/anonymous-statistics/">
                        {localize('netdata.statistics_link', '(see here)')}
                    </NewTabLink>
                    .{' '}
                    {localize(
                        'netdata.custom_image',
                        "You can recompile CapRover with a different customized image if you'd like."
                    )}
                    .
                </p>
                <p>
                    {localize(
                        'netdata.caprover_interface',
                        'CapRover provides a simple interface to enable NetData on your CapRover instance. Currently, CapRover only supports installing NetData on your <b>leader node</b>, i.e., the node where CapRover instance resides. This limitation is due to a limitation in Docker interface'
                    )}
                    <NewTabLink url="https://github.com/moby/moby/issues/25885/">
                        {localize(
                            'netdata.docker_limitation_link',
                            '(see here)'
                        )}
                    </NewTabLink>
                    .
                </p>
                <p>
                    <i>
                        {localize(
                            'netdata.more_details',
                            'For more details regarding NetData, visit their GitHub page'
                        )}
                    </i>
                    <NewTabLink url="https://github.com/firehol/netdata/">
                        {localize('netdata.github_link', '(see here)')}
                    </NewTabLink>
                    .
                </p>
            </div>
        )
    }
}
