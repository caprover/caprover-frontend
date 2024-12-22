import { Component } from 'react'
import GoAccessInfo from './GoAccessInfo'
import LoadBalancerStats from './LoadBalancerStats'
import NetDataInfo from './NetDataInfo'

export default class Monitoring extends Component {
    render() {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '50px',
                }}
            >
                <LoadBalancerStats />
                <NetDataInfo />
                <GoAccessInfo />
            </div>
        )
    }
}
