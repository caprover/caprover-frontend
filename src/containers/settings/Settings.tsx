import { Card } from 'antd'
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

class Settings extends Component<{ isMobile: boolean }, {}> {
    render() {
        return (
            <div className="settings-page">
                <div className="page-heading">
                    <h1>{localize('menu_item.settings', 'Settings')}</h1>
                    <p>
                        {localize(
                            'settings.subtitle',
                            'Manage your workspace, appearance, and security.'
                        )}
                    </p>
                </div>
                <div className="settings-grid">
                    <Card title={localize('settings.appearance', 'Appearance')}>
                        <div className="settings-preference">
                            <span>
                                {localize('navigation.language', 'Language')}
                            </span>
                            <LanguageSelector />
                        </div>
                        <div className="settings-preference">
                            <span>
                                {localize('settings.color_mode', 'Color mode')}
                            </span>
                            <DarkModeSwitch />
                        </div>
                        <div className="section-divider" />
                        <ThemeSettings />
                    </Card>
                    <Card
                        title={localize(
                            'settings.change_password',
                            'Change Password'
                        )}
                    >
                        <ChangePass isMobile={this.props.isMobile} />
                    </Card>
                </div>
                <ProFeatures isMobile={this.props.isMobile} />
                <Card
                    title={localize(
                        'settings.nginx_configurations',
                        'NGINX Configurations'
                    )}
                >
                    <NginxConfig isMobile={this.props.isMobile} />
                </Card>
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    return { isMobile: state.globalReducer.isMobile }
}

export default connect<IMobileComponent, any, any>(
    mapStateToProps,
    undefined
)(Settings)
