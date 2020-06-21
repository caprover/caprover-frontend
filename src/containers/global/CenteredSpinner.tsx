import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import React, { Component } from 'react'

export default class CenteredSpinner extends Component {
    render() {
        const antIcon = <LoadingOutlined style={{ fontSize: 32 }} spin />

        return (
            <div
                style={{
                    width: '100%',
                    textAlign: 'center',
                }}
            >
                <Spin
                    style={{
                        marginTop: 60,
                        marginBottom: 60,
                        width: '100%',
                    }}
                    indicator={antIcon}
                    size="large"
                />
            </div>
        )
    }
}
