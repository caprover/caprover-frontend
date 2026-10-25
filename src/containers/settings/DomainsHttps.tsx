import { Button, Card, Col, Input, Modal, Row, Space, Tag, Tooltip } from 'antd'
import { ArrowUpRight, Globe, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Redirect, RouteComponentProps, withRouter } from 'react-router'
import { Fragment } from 'react/jsx-runtime'
import AppConstants from '../../utils/AppConstants'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import NewTabLink from '../global/NewTabLink'
const Search = Input.Search

interface DomainsHttpsProps extends RouteComponentProps<any> {
    guided?: boolean
}

export class DomainsHttps extends ApiComponent<
    DomainsHttpsProps,
    {
        isLoading: boolean
        isForceChangingDomain: boolean
        apiData: any
        userEmail: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            userEmail: '',
            isLoading: true,
            isForceChangingDomain: false,
            apiData: undefined,
        }
    }

    componentDidMount() {
        this.reFetchData()
    }

    reFetchData() {
        const self = this
        self.setState({ isLoading: true, apiData: undefined })
        return this.apiManager
            .getCaptainInfo()
            .then(function (data: any) {
                self.setState({ apiData: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    onForceSslClicked() {
        const self = this

        const isUsingHttp = window.location.href.startsWith('http://')

        Modal.confirm({
            title: localize('dashboard.force_https', 'Force HTTPS'),
            content: (
                <p>
                    {localize(
                        'dashboard.force_https_info',
                        'Once Force HTTPS is activated, all HTTP traffic is redirected to HTTPS.'
                    )}
                    {isUsingHttp
                        ? localize(
                              'dashboard.force_https_warning',
                              'Since this is a one-way action, and there is no revert, it is highly recommended that you test the HTTPS website first.'
                          )
                        : ''}{' '}
                    {localize(
                        'dashboard.force_https_proceed',
                        'Do you still want to proceed?'
                    )}
                </p>
            ),
            onOk() {
                self.setState({ isLoading: true })
                self.apiManager
                    .forceSsl(true)
                    .then(function () {
                        self.setState({
                            apiData: { ...self.state.apiData, forceSsl: true },
                        })
                        Modal.success({
                            title: localize(
                                'dashboard.force_https_activated',
                                'Force HTTPS activated!'
                            ),
                            content: (
                                <div>
                                    <p>
                                        {localize(
                                            'dashboard.force_https_redirect',
                                            'All HTTP traffic is now redirected to HTTPS.'
                                        )}
                                        {isUsingHttp
                                            ? localize(
                                                  'dashboard.force_https_login_again',
                                                  'You will have to login again as you will now be redirected to HTTPS website.'
                                              )
                                            : ''}
                                    </p>
                                </div>
                            ),
                            onOk() {
                                if (isUsingHttp) {
                                    window.location.replace(
                                        `https://${self.state.apiData.captainSubDomain}.${self.state.apiData.rootDomain}`
                                    )
                                }
                            },
                            onCancel() {
                                if (isUsingHttp) {
                                    window.location.replace(
                                        `https://${self.state.apiData.rootDomain}`
                                    )
                                }
                            },
                        })
                    })
                    .catch(Toaster.createCatcher())
                    .then(function () {
                        self.setState({ isLoading: false })
                    })
            },
            onCancel() {
                // do nothing
            },
        })
    }

    onEnableSslClicked() {
        const self = this
        const IGNORE = 'IGNORE'

        const translated = localize(
            'dashboard.enable_ssl_dialog_body',
            'IMPORTANT: Once you enable HTTPS, you cannot edit the root domain ever again. Make sure you use a good root domain. A good practice is to go one level deeper and setup your root domain. For example, if you own %s1, use %s2 as your root domain. This will allow you to better manage your subdomains, do not use %s3 as your root domain.'
        )

        Promise.resolve()
            .then(function () {
                return new Promise(function (resolve, reject) {
                    Modal.success({
                        title: localize(
                            'dashboard.enable_https',
                            'Enable HTTPS'
                        ),
                        content: (
                            <div>
                                <p>
                                    {localize(
                                        'dashboard.enable_https_info',
                                        "CapRover uses Let's Encrypt to provide free SSL Certificates (HTTPS)."
                                    )}
                                    {localize(
                                        'dashboard.enable_https_email_importance',
                                        "This email address is very important as Let's Encrypt uses it for validation purposes. Please provide a valid email here."
                                    )}
                                </p>
                                <p>
                                    {Utils.formatText(
                                        translated,
                                        ['%s1', '%s2', '%s3'],
                                        [
                                            <code>example.com</code>,
                                            <code>
                                                *.caprover-root.example.com
                                            </code>,
                                            <code>*.example.com</code>,
                                        ]
                                    )}
                                </p>
                                <Input
                                    placeholder="your@email.com"
                                    type="email"
                                    onChange={(event) =>
                                        self.setState({
                                            userEmail: (
                                                event.target.value || ''
                                            ).trim(),
                                        })
                                    }
                                />
                            </div>
                        ),
                        onOk() {
                            resolve(self.state.userEmail || '')
                        },
                        onCancel() {
                            resolve(undefined)
                        },
                    })
                })
            })
            .then(function (data: any) {
                if (data === undefined) return Promise.resolve(IGNORE)
                self.setState({ isLoading: true })
                return self.apiManager
                    .enableRootSsl(data) //
                    .then(function () {
                        return Promise.resolve('')
                    })
            })

            .then(function (data: any) {
                if (data === IGNORE) return

                Modal.success({
                    title: localize(
                        'dashboard.root_domain_https_activated',
                        'Root Domain HTTPS activated!'
                    ),
                    content: (
                        <div>
                            <p>
                                {localize(
                                    'dashboard.root_domain_https_info',
                                    'You can now use this link:'
                                )}
                                <code>
                                    {`https://${self.state.apiData.rootDomain}`}
                                </code>
                                {localize(
                                    'dashboard.root_domain_https_next_step',
                                    '. Next step is to Force HTTPS to disallow plain HTTP traffic.'
                                )}
                            </p>
                        </div>
                    ),
                })

                return self.reFetchData()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    updateRootDomainClicked(rootDomain: string) {
        const self = this
        if (!self.state.apiData.hasRootSsl) {
            self.performUpdateRootDomain(rootDomain, false)
            return
        }

        Modal.confirm({
            title: localize(
                'dashboard.force_change_root_domain',
                'Force Change Root Domain'
            ),
            content: (
                <div>
                    <p>
                        {localize(
                            'dashboard.force_change_root_domain_info',
                            'You have already enabled SSL for your root domain. Changing the root domain URL will invalidate HTTPS on root domain and all default subdomains for apps if you have any apps.'
                        )}
                    </p>
                    <p>
                        {localize(
                            'dashboard.force_change_root_domain_reenable',
                            'You can still re-enable HTTPS after changing the root domain.'
                        )}
                    </p>
                </div>
            ),
            onOk() {
                self.performUpdateRootDomain(rootDomain, true)
            },
            onCancel() {
                // do nothing
            },
        })
    }

    performUpdateRootDomain(rootDomain: string, force: boolean) {
        const self = this

        this.apiManager
            .updateRootDomain(rootDomain, force)
            .then(function (data: any) {
                Modal.success({
                    title: localize(
                        'dashboard.root_domain_updated',
                        'Root Domain Updated'
                    ),
                    content: (
                        <div>
                            <p>
                                {localize(
                                    'dashboard.root_domain_updated_info',
                                    'Click Ok to get redirected to your new root domain. You need to log in again.'
                                )}
                            </p>
                        </div>
                    ),
                    onOk() {
                        window.location.replace(
                            `http://${self.state.apiData.captainSubDomain}.${rootDomain}`
                        )
                    },
                })
            })
            .catch(Toaster.createCatcher())
    }

    render() {
        const self = this

        if (self.state.isLoading) {
            return <CenteredSpinner />
        }

        if (!self.state.apiData) {
            return <ErrorRetry />
        }

        if (!this.props.guided) {
            return this.createSetupPanelIfNoForceSsl()
        }

        const qs = new URLSearchParams(self.props.location.search)

        if (
            !!this.state.apiData.forceSsl &&
            !!qs.get(AppConstants.REDIRECT_TO_APPS_IF_READY_REQ_PARAM)
        ) {
            return <Redirect to="/apps" />
        }

        return (
            <div className="dashboard-page">
                <div className="page-heading">
                    <h1>{localize('dashboard.overview', 'Overview')}</h1>
                    <p>
                        {localize(
                            'dashboard.overview_subtitle',
                            'Your deployment platform at a glance.'
                        )}
                    </p>
                </div>
                <div className="overview-grid">
                    <Card>
                        <div className="metric-heading">
                            <span>
                                {localize(
                                    'dashboard.root_domain',
                                    'Root domain'
                                )}
                            </span>
                            <Globe size={16} />
                        </div>
                        <div className="overview-value">
                            {self.state.apiData.rootDomain ||
                                localize(
                                    'dashboard.not_configured',
                                    'Not configured'
                                )}
                        </div>
                        <div className="overview-caption">
                            {localize(
                                'dashboard.root_domain_hint',
                                'Default domain for your applications'
                            )}
                        </div>
                    </Card>
                    <Card>
                        <div className="metric-heading">
                            <span>HTTPS</span>
                            <LockKeyhole size={16} />
                        </div>
                        <div className="overview-value">
                            {self.state.apiData.hasRootSsl
                                ? localize('dashboard.enabled', 'Enabled')
                                : localize(
                                      'dashboard.not_configured',
                                      'Not configured'
                                  )}
                        </div>
                        <div className="overview-caption">
                            {localize(
                                'dashboard.root_certificate',
                                'Root domain certificate'
                            )}
                        </div>
                    </Card>
                    <Card>
                        <div className="metric-heading">
                            <span>
                                {localize(
                                    'dashboard.enforce_https',
                                    'Enforce HTTPS'
                                )}
                            </span>
                            <ShieldCheck size={16} />
                        </div>
                        <div className="overview-value">
                            {self.state.apiData.forceSsl
                                ? localize('dashboard.enabled', 'Enabled')
                                : localize('dashboard.disabled', 'Disabled')}
                        </div>
                        <div className="overview-caption">
                            {localize(
                                'dashboard.https_redirect',
                                'Automatic secure redirects'
                            )}
                        </div>
                    </Card>
                </div>
                {self.createInitialSetupIfNoRootSsl()}
                {self.createPostFullSetupIfHasForceSsl()}
                {self.createSetupPanelIfNoForceSsl()}
            </div>
        )
    }

    createSetupPanelIfNoForceSsl() {
        const self = this
        if (
            this.props.guided &&
            this.state.apiData.forceSsl &&
            !self.state.isForceChangingDomain
        ) {
            // User has set up the machine, no need to update your domain again - unless user really wants this!
            return undefined
        }

        const replacements = [
            <span>
                <i> myawesomecompany.com </i>
            </span>,
            <i> captain.myawesomecompany.com </i>,
            <i> foo.bar.myawesomecompany.com </i>,
            <Fragment>
                <br />
                <b> Type:</b> <u>A</u>, <b>Name (or host):</b>{' '}
                <u> *.caprover-root</u>, <b> IP (or Points to):</b>{' '}
                <u> 110.120.130.140 </u>
                <br />
            </Fragment>,
        ]
        const translatedBody = Utils.formatText(
            localize(
                'dashboard.detailed_guide_setup_ip',
                'The very first thing that CapRover needs is a root domain. For example, if you own %s1, you can use %s2 or %s3 as your root domain. First, you need to make sure that the ip address for all subdomains of the root domain resolve to the CapRover ip address. To do this, go to the DNS settings in your domain provider website, and set a wild card A entry. For example: %s4 where this IP is the IP address of your CapRover machine (server).'
            ),
            ['%s1', '%s2', '%s3', '%s4'],
            replacements
        )

        const translatedHint = Utils.formatText(
            localize(
                'dashboard.ip_example_hint_specific',
                'For example, if you set %s1 to the IP address of your server, just enter %s2 in the box below:'
            ),
            ['%s1', '%s2'],
            [
                <code>*.my-root.example.com</code>,
                <code>my-root.example.com</code>,
            ]
        )

        return (
            <Row justify="center">
                <Col span={24}>
                    <Card
                        title={
                            this.props.guided
                                ? localize(
                                      'dashboard.root_domain_configurations',
                                      'CapRover Root Domain Configurations'
                                  )
                                : localize(
                                      'settings.domains_https',
                                      'Domains & HTTPS'
                                  )
                        }
                    >
                        {!this.props.guided && (
                            <Space
                                direction="vertical"
                                style={{ width: '100%', marginBottom: 20 }}
                            >
                                <strong>
                                    {self.state.apiData.rootDomain ||
                                        localize(
                                            'dashboard.not_configured',
                                            'Not configured'
                                        )}
                                </strong>
                                <Space wrap>
                                    <Tag
                                        color={
                                            self.state.apiData.hasRootSsl
                                                ? 'success'
                                                : 'default'
                                        }
                                    >
                                        HTTPS:{' '}
                                        {self.state.apiData.hasRootSsl
                                            ? localize(
                                                  'dashboard.enabled',
                                                  'Enabled'
                                              )
                                            : localize(
                                                  'dashboard.not_configured',
                                                  'Not configured'
                                              )}
                                    </Tag>
                                    <Tag
                                        color={
                                            self.state.apiData.forceSsl
                                                ? 'success'
                                                : 'default'
                                        }
                                    >
                                        {localize(
                                            'dashboard.enforce_https',
                                            'Enforce HTTPS'
                                        )}
                                        :{' '}
                                        {self.state.apiData.forceSsl
                                            ? localize(
                                                  'dashboard.enabled',
                                                  'Enabled'
                                              )
                                            : localize(
                                                  'dashboard.disabled',
                                                  'Disabled'
                                              )}
                                    </Tag>
                                </Space>
                            </Space>
                        )}
                        {self.state.apiData.forceSsl &&
                        !self.state.isForceChangingDomain ? (
                            <div>
                                <Button
                                    onClick={() =>
                                        self.setState({
                                            isForceChangingDomain: true,
                                        })
                                    }
                                >
                                    {localize(
                                        'settings.change_root_domain',
                                        'Change Root Domain'
                                    )}
                                </Button>
                                <p className="domain-change-warning">
                                    {localize(
                                        'dashboard.update_root_domain_caution',
                                        'You can always update your root domain, but be careful! Your SSL certificates will get revoked because of this domain change.'
                                    )}
                                </p>
                            </div>
                        ) : (
                            <>
                                {this.props.guided && (
                                    <>
                                        <div>
                                            <p>{translatedBody}</p>
                                            <p>
                                                <i>
                                                    {localize(
                                                        'dashboard.dns_settings_effect_time',
                                                        'NOTE: DNS settings might take several hours to take into effect.'
                                                    )}
                                                    <NewTabLink url="https://ca.godaddy.com/help/what-factors-affect-dns-propagation-time-1746">
                                                        {' '}
                                                        {localize(
                                                            'dashboard.dns_settings_effect_time_link',
                                                            'See this link for more details'
                                                        )}
                                                    </NewTabLink>{' '}
                                                </i>
                                            </p>
                                        </div>
                                        <hr />
                                        <br />
                                    </>
                                )}
                                <Row>
                                    <div>
                                        <p>{translatedHint}</p>
                                        <br />
                                        <div>
                                            <Search
                                                addonBefore="[wildcard]&nbsp;."
                                                placeholder="my-root.example.com"
                                                defaultValue={
                                                    self.state.apiData
                                                        .rootDomain + ''
                                                }
                                                enterButton={localize(
                                                    'dashboard.update_domain_button',
                                                    'Update Domain'
                                                )}
                                                onSearch={(value) =>
                                                    self.updateRootDomainClicked(
                                                        value
                                                    )
                                                }
                                            />
                                        </div>
                                    </div>
                                </Row>
                                <div style={{ height: 20 }} />
                                <Row justify="end">
                                    <Tooltip
                                        title={localize(
                                            'dashboard.enable_https_button_hint',
                                            "Using Let's Encrypt Free Service"
                                        )}
                                    >
                                        <Button
                                            disabled={
                                                self.state.apiData.hasRootSsl ||
                                                !self.state.apiData.rootDomain
                                            }
                                            onClick={() =>
                                                self.onEnableSslClicked()
                                            }
                                        >
                                            {localize(
                                                'dashboard.enable_https_button',
                                                'Enable HTTPS'
                                            )}
                                        </Button>
                                    </Tooltip>
                                    &nbsp;&nbsp;
                                    <Tooltip
                                        title={localize(
                                            'dashboard.force_https_button_hint',
                                            'Redirect all HTTP to HTTPS'
                                        )}
                                    >
                                        <Button
                                            disabled={
                                                !self.state.apiData
                                                    .hasRootSsl ||
                                                self.state.apiData.forceSsl
                                            }
                                            onClick={() =>
                                                self.onForceSslClicked()
                                            }
                                        >
                                            {localize(
                                                'dashboard.force_https_button',
                                                'Force HTTPS'
                                            )}
                                        </Button>
                                    </Tooltip>
                                </Row>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>
        )
    }

    createInitialSetupIfNoRootSsl() {
        if (this.state.apiData.hasRootSsl) {
            // User has set up the machine, no need to show the welcome message
            return <div />
        }

        return (
            <Row justify="center">
                <Col span={24}>
                    <Card
                        title={localize(
                            'dashboard.setup_panel_title',
                            'CapRover Initial Setup'
                        )}
                    >
                        <div>
                            <h3>
                                {localize(
                                    'dashboard.congratulations',
                                    'Congratulations!'
                                )}{' '}
                                <span aria-label="Congrats" role="img">
                                    🎉🎉
                                </span>
                            </h3>
                            <p>
                                <b />{' '}
                                {localize(
                                    'dashboard.successful_installation',
                                    'You have installed CapRover successfully!'
                                )}{' '}
                                <b>
                                    {localize(
                                        'dashboard.https_setup_needed',
                                        'But you still need to assign a domain and finish the HTTPS setup to fully set up CapRover!'
                                    )}
                                </b>
                                {localize(
                                    'dashboard.setup_options',
                                    'You can set up your CapRover instance in two ways:'
                                )}
                            </p>

                            <ul>
                                <li>
                                    <b>
                                        {localize(
                                            'dashboard.command_line_tool',
                                            'Command Line Tool (RECOMMENDED):'
                                        )}{' '}
                                    </b>{' '}
                                    {localize(
                                        'dashboard.run_on_local_machine',
                                        'On your local machine, simply run the following commands'
                                    )}
                                    <br />
                                    <code>npm i -g caprover</code>
                                    <br />
                                    <code>
                                        {localize(
                                            'dashboard.caprover_serversetup',
                                            'caprover serversetup'
                                        )}
                                    </code>
                                    .{' '}
                                </li>
                                <li>
                                    <b>
                                        {localize(
                                            'dashboard.use_panel_below',
                                            'Use the panel below:'
                                        )}{' '}
                                    </b>{' '}
                                    {localize(
                                        'dashboard.non_guided_version',
                                        "This is a non-guided version of the Command Line method. Don't forget to set the root domain, then enable HTTPS and force it, and finally change the password."
                                    )}
                                </li>
                            </ul>
                        </div>
                    </Card>
                </Col>
            </Row>
        )
    }

    createPostFullSetupIfHasForceSsl() {
        const self = this
        if (!this.state.apiData.forceSsl) {
            // User has not fully set up the machine, do not show the post installation message
            return undefined
        }

        return (
            <Row justify="center">
                <Col span={24}>
                    <Card
                        title={localize(
                            'dashboard.workspace_ready',
                            'Ready to deploy'
                        )}
                        extra={
                            <Button
                                type="primary"
                                onClick={() => self.props.history.push('/apps')}
                                icon={<ArrowUpRight size={14} />}
                            >
                                {localize(
                                    'dashboard.open_apps',
                                    'Open applications'
                                )}
                            </Button>
                        }
                    >
                        <p className="muted-description">
                            {localize(
                                'dashboard.ready_description',
                                'Deploy code, connect a repository, or launch a ready-to-use app. Your domain and HTTPS are configured.'
                            )}
                        </p>
                        <div className="dashboard-links">
                            <NewTabLink url="https://caprover.com/docs/sample-apps.html">
                                {localize(
                                    'dashboard.sample_apps',
                                    'Sample apps'
                                )}
                            </NewTabLink>
                            <Button
                                disabled={this.state.isForceChangingDomain}
                                onClick={() =>
                                    self.setState({
                                        isForceChangingDomain: true,
                                    })
                                }
                            >
                                {localize(
                                    'dashboard.change_root_domain_anyways',
                                    'Change Root Domain Anyways'
                                )}
                            </Button>
                        </div>
                        <p className="domain-change-warning">
                            {localize(
                                'dashboard.update_root_domain_caution',
                                'You can always update your root domain, but be careful! Your SSL certificates will get revoked because of this domain change.'
                            )}
                        </p>
                    </Card>
                </Col>
            </Row>
        )
    }
}

export default withRouter(DomainsHttps)
