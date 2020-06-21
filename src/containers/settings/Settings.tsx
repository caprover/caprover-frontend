import React, { Component } from 'react'
import { Row, Col, Card } from 'antd'
import { connect } from 'react-redux'
import ChangePass from './ChangePass'
import CheckUpdate from './CheckUpdate'
import NginxConfig from './NginxConfig'
import DiskCleanup from './DiskCleanup'
import BackupCreator from './BackupCreator'

class Settings extends Component<
    {
        isMobile: boolean
    },
    {}
> {
    render() {
        return (
            <div>
                <Row type="flex" justify="center" gutter={20}>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 10 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title="Check for Updates"
                        >
                            <CheckUpdate isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 10 }}
                        xs={{ span: 23 }}
                    >
                        <Card style={{ height: '100%' }} title="Backup">
                            <BackupCreator isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 20 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title="NGINX Configurations"
                        >
                            <NginxConfig isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 6 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title="Change Password"
                        >
                            <ChangePass isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 14 }}
                        xs={{ span: 23 }}
                    >
                        <Card style={{ height: '100%' }} title="Disk Cleanup">
                            <DiskCleanup isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect(mapStateToProps, null)(Settings)
