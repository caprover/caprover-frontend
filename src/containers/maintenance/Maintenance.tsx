import { Card, Col, Collapse, Row } from 'antd'
import { Component } from 'react'
import { connect } from 'react-redux'
import { IMobileComponent } from '../../models/ContainerProps'
import { localize } from '../../utils/Language'
import AutomaticDiskCleanup from './AutomaticDiskCleanup'
import BackupCreator from './BackupCreator'
import CheckUpdate from './CheckUpdate'
import DiskCleanup from './DiskCleanup'

class Maintenance extends Component<
    {
        isMobile: boolean
    },
    {}
> {
    render() {
        return (
            <div>
                <Row justify="center" gutter={20}>
                    <Col
                        style={{ marginBottom: 20, marginTop: 20 }}
                        lg={{ span: 10 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title={localize(
                                'settings.check_for_updates',
                                'Check for Updates'
                            )}
                        >
                            <CheckUpdate isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                    <Col
                        style={{ marginBottom: 20, marginTop: 20 }}
                        lg={{ span: 10 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title={localize('settings.backup', 'Backup')}
                        >
                            <BackupCreator isMobile={this.props.isMobile} />
                        </Card>
                    </Col>

                    <Col
                        style={{ marginBottom: 20, marginTop: 20 }}
                        lg={{ span: 14 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title={localize(
                                'settings.disk_cleanup',
                                'Disk Cleanup'
                            )}
                        >
                            <AutomaticDiskCleanup
                                isMobile={this.props.isMobile}
                            />

                            <div style={{ marginBottom: 40 }} />

                            <Collapse
                                size="small"
                                items={[
                                    {
                                        key: '1',
                                        label: localize(
                                            'settings.one_off_cleanup',
                                            'One off cleanup'
                                        ),
                                        children: (
                                            <DiskCleanup
                                                isMobile={this.props.isMobile}
                                            />
                                        ),
                                    },
                                ]}
                            />
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

export default connect<IMobileComponent, any, any>(
    mapStateToProps,
    undefined
)(Maintenance)
