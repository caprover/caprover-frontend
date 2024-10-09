import { Card } from 'antd'
import { Component, ReactNode } from 'react'

interface DescriptionPanelProps {
    headerText: string
    children?: ReactNode
}

class DescriptionPanel extends Component<DescriptionPanelProps> {
    render() {
        const { children, headerText } = this.props

        return (
            <Card style={{ marginTop: 24 }}>
                <span
                    style={{
                        position: 'absolute',
                        paddingBottom: 0,
                        marginTop: -40,
                        marginInlineStart: -15,
                    }}
                >
                    <Card
                        styles={{ body: { padding: 5 } }}
                        style={{
                            border: 0,
                        }}
                    >
                        <h4 style={{ margin: 0, padding: 0 }}>{headerText}</h4>
                    </Card>
                </span>
                {children || ''}
            </Card>
        )
    }
}

export default DescriptionPanel
