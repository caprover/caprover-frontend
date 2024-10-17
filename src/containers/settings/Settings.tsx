import { Card, Col, Row } from 'antd'
import { Component } from 'react'
import { connect } from 'react-redux'
import { IMobileComponent } from '../../models/ContainerProps'
import { localize } from '../../utils/Language'
import DarkModeSwitch from '../global/DarkModeSwitch'
import LanguageSelector from '../global/LanguageSelector'
import ChangePass from './ChangePass'
import NginxConfig from './NginxConfig'
import ProFeatures from './ProFeatures'
import ThemeSettings from './ThemeSettings'

class Settings extends Component<
    {
        isMobile: boolean
    },
    {}
> {
    render() {
        const self = this
        function createMobileOnlyComponents() {
            if (!self.props.isMobile) return <div></div>

            return (
                <Col
                    style={{ marginTop: 10, marginBottom: 10 }}
                    lg={{ span: 8 }}
                    xs={{ span: 23 }}
                >
                    <Card style={{ height: '100%' }} title={''}>
                        <Row justify={'space-between'}>
                            <div>
                                <LanguageSelector />
                            </div>
                            <div style={{ marginInlineEnd: 5 }}>
                                <DarkModeSwitch />
                            </div>
                        </Row>
                    </Card>
                </Col>
            )
        }

        return (
            <div>
                <Row justify="center" gutter={20}>
                    <Col
                        style={{ marginTop: 40, marginBottom: 80 }}
                        lg={{ span: 10 }}
                        xs={{ span: 23 }}
                    >
                        <ProFeatures isMobile={this.props.isMobile} />
                    </Col>{' '}
                    {createMobileOnlyComponents()}
                    <Col
                        style={{ marginTop: 40, marginBottom: 80 }}
                        lg={{ span: 8 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title={localize(
                                'settings.change_password',
                                'Change Password'
                            )}
                        >
                            <ChangePass isMobile={this.props.isMobile} />
                        </Card>
                    </Col>
                </Row>

                <Row justify="center" gutter={20}>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 14 }}
                        md={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title={localize('settings.themes', 'Themes')}
                        >
                            <ThemeSettings />
                        </Card>
                    </Col>
                </Row>
                <Row justify="center" gutter={20}>
                    <Col
                        style={{ marginBottom: 20 }}
                        lg={{ span: 18 }}
                        xs={{ span: 23 }}
                    >
                        <Card
                            style={{ height: '100%' }}
                            title={localize(
                                'settings.nginx_configurations',
                                'NGINX Configurations'
                            )}
                        >
                            <NginxConfig isMobile={this.props.isMobile} />
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
)(Settings)
