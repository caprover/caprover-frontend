import { Card } from 'antd'
import { connect } from 'react-redux'
import { IMobileComponent } from '../../models/ContainerProps'
import { IProFeatures } from '../../models/IProFeatures'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import DarkModeSwitch from '../global/DarkModeSwitch'
import LanguageSelector from '../global/LanguageSelector'
import ChangePass from './ChangePass'
import DomainsHttps from './DomainsHttps'
import NginxConfig from './NginxConfig'
import OtpSettings from './OtpSettings'
import ProFeatures from './ProFeatures'
import ThemeSettings from './ThemeSettings'

export class Settings extends ApiComponent<
    { isMobile: boolean },
    { apiData: IProFeatures | undefined; rootDomain: string }
> {
    constructor(props: any) {
        super(props)
        this.state = { apiData: undefined, rootDomain: '' }
    }

    componentDidMount() {
        this.fetchProFeatures()
    }

    fetchProFeatures() {
        const self = this
        return Promise.all([
            this.apiManager.getCaptainInfo(),
            this.apiManager.getProFeaturesState(),
        ])
            .then(function (result) {
                self.setState({
                    apiData: result[1].proFeaturesState,
                    rootDomain: result[0].rootDomain,
                })
            })
            .catch(Toaster.createCatcher())
    }

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
                <ProFeatures
                    isMobile={this.props.isMobile}
                    apiData={this.state.apiData}
                    onRefreshRequested={() => this.fetchProFeatures()}
                />
                <DomainsHttps />
                <div className="settings-grid">
                    <Card title={localize('settings.security', 'Security')}>
                        <ChangePass isMobile={this.props.isMobile} />
                        {this.state.apiData?.isFeatureFlagEnabled &&
                            this.state.apiData.isSubscribed && (
                                <>
                                    <div className="section-divider" />
                                    <OtpSettings
                                        rootDomain={this.state.rootDomain}
                                    />
                                </>
                            )}
                    </Card>
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
                </div>
                <Card title={localize('settings.advanced', 'Advanced')}>
                    <h3>
                        {localize(
                            'settings.nginx_configurations',
                            'NGINX Configurations'
                        )}
                    </h3>
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
