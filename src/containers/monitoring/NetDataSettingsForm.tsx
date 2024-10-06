import { Checkbox, Col, Input, Row, Tooltip } from 'antd'
import { Component } from 'react'
import { localize } from '../../utils/Language'
import Utils from '../../utils/Utils'
import PasswordField from '../global/PasswordField'

export default class NetDataSettingsForm extends Component<{
    netDataInfo: any
    updateModel: (netDataInfo: any) => void
}> {
    changeModel(
        parentField: string,
        childField: string,
        value: string | boolean
    ) {
        const netDataInfo = Utils.copyObject(this.props.netDataInfo)
        const netDataInfoData = netDataInfo.data
        if (!netDataInfoData[parentField]) {
            netDataInfoData[parentField] = {}
        }
        netDataInfoData[parentField][childField] = value
        this.props.updateModel(netDataInfo)
    }

    render() {
        const self = this
        const netDataInfo = this.props.netDataInfo
        return (
            <div>
                <h3>
                    {localize(
                        'netdata_settings.notification_settings',
                        'Notification Settings'
                    )}
                </h3>

                <p>
                    {localize(
                        'netdata_settings.netdata_offers_multiple_ways',
                        'NetData offers multiple ways for you to receive notifications if something is going wrong with your server resource usage.'
                    )}
                    <i>
                        {localize(
                            'netdata_settings.all_notification_options_are_completely_optional',
                            'All notification options are completely OPTIONAL.'
                        )}
                    </i>
                </p>
                <hr />
                <br />
                <h4>
                    {localize('netdata_settings.email_smtp', 'Email')} (SMTP)
                </h4>

                <Row justify="center">
                    <Col xs={{ span: 23 }} lg={{ span: 20 }}>
                        <Row gutter={20} align="middle">
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.recipient_email',
                                    'Recipient Email'
                                )}
                                <Input
                                    type="text"
                                    placeholder="alerts.receiver@example.com"
                                    value={netDataInfo.data.smtp.to}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'smtp',
                                            'to',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>

                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.server_tag',
                                    'Server Tag'
                                )}
                                <Input
                                    type="text"
                                    placeholder="my-aws-server-01-anything"
                                    value={netDataInfo.data.smtp.hostname}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'smtp',
                                            'hostname',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>

                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.smtp_server',
                                    'SMTP Server'
                                )}
                                <Input
                                    type="text"
                                    placeholder="smtp.gmail.com"
                                    value={netDataInfo.data.smtp.server}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'smtp',
                                            'server',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>

                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 6 }}
                            >
                                {localize(
                                    'netdata_settings.smtp_port',
                                    'SMTP Port'
                                )}
                                <Input
                                    type="number"
                                    placeholder="587"
                                    value={netDataInfo.data.smtp.port}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'smtp',
                                            'port',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>

                            <Col
                                className="netdata-field"
                                style={{ marginTop: 25 }}
                                xs={{ span: 24 }}
                                lg={{ span: 6 }}
                            >
                                <Tooltip
                                    title={localize(
                                        'netdata_settings.allow_non_tls',
                                        'allow non-TLS'
                                    )}
                                >
                                    <Checkbox
                                        checked={
                                            !!netDataInfo.data.smtp.allowNonTls
                                        }
                                        onChange={(e) =>
                                            self.changeModel(
                                                'smtp',
                                                'allowNonTls',
                                                e.target.checked
                                            )
                                        }
                                    >
                                        {localize(
                                            'netdata_settings.unsecure',
                                            'Unsecure'
                                        )}
                                    </Checkbox>
                                </Tooltip>
                            </Col>

                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.smtp_username',
                                    'SMTP Username'
                                )}
                                <Input
                                    type="text"
                                    placeholder="alerts.receiver@example.com"
                                    value={netDataInfo.data.smtp.username}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'smtp',
                                            'username',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>

                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.smtp_password',
                                    'SMTP password'
                                )}
                                <PasswordField
                                    defaultValue={
                                        netDataInfo.data.smtp.password
                                    }
                                    onChange={(e) =>
                                        self.changeModel(
                                            'smtp',
                                            'password',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <br />
                <h4>{localize('netdata_settings.slack', 'Slack')}</h4>
                <Row justify="center">
                    <Col xs={{ span: 24 }} lg={{ span: 20 }}>
                        <Row gutter={20} align="middle">
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.slack_webhook',
                                    'Slack Webhook'
                                )}
                                <Input
                                    type="text"
                                    placeholder="https://hooks.slack.com/services/XXXX"
                                    value={netDataInfo.data.slack.hook}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'slack',
                                            'hook',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.slack_channel',
                                    'Slack Channel'
                                )}
                                <Input
                                    type="text"
                                    placeholder="alertschannel"
                                    value={netDataInfo.data.slack.channel}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'slack',
                                            'channel',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <br />
                <h4>{localize('netdata_settings.telegram', 'Telegram')}</h4>
                <Row justify="center">
                    <Col xs={{ span: 24 }} lg={{ span: 20 }}>
                        <Row gutter={20} align="middle">
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.telegram_bot_token',
                                    'Bot Token'
                                )}
                                <Input
                                    type="text"
                                    placeholder="TELEGRAM_BOT_TOKEN"
                                    value={netDataInfo.data.telegram.botToken}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'telegram',
                                            'botToken',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.telegram_chat_id',
                                    'Chat ID'
                                )}
                                <Input
                                    type="text"
                                    placeholder="Telegram Chat ID"
                                    value={netDataInfo.data.telegram.chatId}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'telegram',
                                            'chatId',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
                <br />
                <h4>
                    {localize('netdata_settings.push_bullet', 'Push Bullet')}
                </h4>
                <Row justify="center">
                    <Col xs={{ span: 24 }} lg={{ span: 20 }}>
                        <Row gutter={20} align="middle">
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.push_bullet_api_token',
                                    'Push Bullet API token'
                                )}
                                <Input
                                    type="text"
                                    placeholder="PUSH_BULLET_API_TOKEN"
                                    value={netDataInfo.data.pushBullet.apiToken}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'pushBullet',
                                            'apiToken',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                            <Col
                                className="netdata-field"
                                xs={{ span: 24 }}
                                lg={{ span: 12 }}
                            >
                                {localize(
                                    'netdata_settings.default_email_fallback_receiver',
                                    'Default Email (fallback receiver)'
                                )}
                                <Input
                                    type="text"
                                    placeholder="alerts.receiver@example.com"
                                    value={
                                        netDataInfo.data.pushBullet
                                            .fallbackEmail
                                    }
                                    onChange={(e) =>
                                        self.changeModel(
                                            'pushBullet',
                                            'fallbackEmail',
                                            e.target.value
                                        )
                                    }
                                />
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </div>
        )
    }
}
