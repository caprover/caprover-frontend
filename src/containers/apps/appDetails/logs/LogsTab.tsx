import { ArrowRightOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Component } from 'react'
import { AppDetailsTabProps } from '../AppDetails'
import AppLogsView from '../deploy/AppLogsView'
import GoAccessLogs from './GoAccessLogs'

class LogsTab extends Component<AppDetailsTabProps, any> {
    render() {
        const self = this
        const appName = self.props.apiData.appDefinition.appName!
        return (
            <div>
                <AppLogsView appName={appName} key={appName! + '-LogsView'} />
                <div style={{ height: 40 }} />
                {self.createGoAccess()}
            </div>
        )
    }
    createGoAccess() {
        const self = this

        if (self.props.apiData.appDefinition.notExposeAsWebApp) return <div />

        if (!self.props.apiData.goAccessInfo.isEnabled)
            return (
                <div>
                    Enable GoAccess Log Analyzer to view HTTP logs
                    <Button
                        style={{ marginLeft: 10 }}
                        onClick={() => {
                            self.props.history.push('/monitoring')
                        }}
                        shape="circle"
                        icon={<ArrowRightOutlined />}
                    />
                </div>
            )

        return (
            <>
                <GoAccessLogs {...self.props} />
            </>
        )
    }
}

export default LogsTab
