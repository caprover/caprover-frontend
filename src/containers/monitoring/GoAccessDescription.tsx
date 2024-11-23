import { Component } from 'react'
import { localize } from '../../utils/Language'
import NewTabLink from '../global/NewTabLink'

export default class NetDataDescription extends Component {
    render() {
        return (
            <div>
                <p>
                    {localize(
                        'goaccess.description_details',
                        'GoAccess is a server side Nginx log analyzer designed to generate self contained HTML reports in real-time with incremental log processing'
                    )}
                    .
                </p>
                <p>
                    <i>
                        {localize(
                            'goaccess.more_details',
                            'For more information, visit the'
                        )}
                    </i>{' '}
                    <NewTabLink url="https://goaccess.io/">
                        {localize('goaccess.link', 'GoAccess website')}
                    </NewTabLink>
                    .
                </p>
            </div>
        )
    }
}
