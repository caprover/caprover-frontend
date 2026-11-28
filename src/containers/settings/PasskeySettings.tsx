import { DeleteOutlined, KeyOutlined } from '@ant-design/icons'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Button, Input, message, Popconfirm, Row } from 'antd'
import { IPasskey } from '../../models/IPasskey'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'

export default class PasskeySettings extends ApiComponent<
    {
        isMobile: boolean
    },
    {
        passkeys: IPasskey[] | undefined
        isRegistering: boolean
        name: string
        password: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            passkeys: undefined,
            isRegistering: false,
            name: '',
            password: '',
        }
    }

    componentDidMount() {
        this.fetchPasskeys()
    }

    fetchPasskeys() {
        const self = this
        return this.apiManager
            .getPasskeys()
            .then(function (data) {
                self.setState({ passkeys: data.passkeys || [] })
            })
            .catch(Toaster.createCatcher())
    }

    onRegisterClicked() {
        const self = this
        if (!this.state.name.trim() || !this.state.password) {
            message.error(
                localize(
                    'passkeys.name_and_password_required',
                    'Enter a name for the passkey and your current password'
                )
            )
            return
        }

        this.setState({ isRegistering: true })

        this.apiManager
            .registerPasskey(this.state.name.trim(), this.state.password)
            .then(function () {
                message.success(
                    localize('passkeys.registered', 'Passkey registered')
                )
                self.setState({ name: '', password: '' })
                return self.fetchPasskeys()
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isRegistering: false })
            })
    }

    onDeleteConfirmed(passkey: IPasskey) {
        const self = this
        return this.apiManager
            .deletePasskey(passkey.id)
            .then(function () {
                message.success(localize('passkeys.removed', 'Passkey removed'))
                return self.fetchPasskeys()
            })
            .catch(Toaster.createCatcher())
    }

    render() {
        const self = this
        const passkeys = this.state.passkeys

        if (!passkeys) {
            return <CenteredSpinner />
        }

        return (
            <div>
                <h3>{localize('passkeys.title', 'Passkeys')}</h3>
                <p>
                    {localize(
                        'passkeys.description',
                        'Sign in with a single touch. Your password keeps working as a recovery option.'
                    )}
                </p>
                {passkeys.length === 0 ? (
                    <p>
                        <i>
                            {localize(
                                'passkeys.none_registered',
                                'No passkeys registered.'
                            )}
                        </i>
                    </p>
                ) : (
                    passkeys.map((passkey) => (
                        <div className="settings-preference" key={passkey.id}>
                            <span>
                                <KeyOutlined /> <b>{passkey.name}</b>
                                <br />
                                <small>
                                    {localize('passkeys.created', 'Created')}{' '}
                                    {Utils.getLocalizedDateTime(
                                        passkey.createdAt
                                    )}
                                    {' · '}
                                    {localize(
                                        'passkeys.last_used',
                                        'Last used'
                                    )}{' '}
                                    {passkey.lastUsedAt
                                        ? Utils.getRelativeDateTime(
                                              passkey.lastUsedAt
                                          )
                                        : localize('passkeys.never', 'never')}
                                </small>
                            </span>
                            <Popconfirm
                                title={localize(
                                    'passkeys.remove_title',
                                    'Remove this passkey?'
                                )}
                                okText={localize('passkeys.remove', 'Remove')}
                                onConfirm={() =>
                                    self.onDeleteConfirmed(passkey)
                                }
                            >
                                <Button
                                    shape="circle"
                                    danger={true}
                                    type="default"
                                    aria-label={localize(
                                        'passkeys.remove',
                                        'Remove'
                                    )}
                                >
                                    <DeleteOutlined />
                                </Button>
                            </Popconfirm>
                        </div>
                    ))
                )}
                {browserSupportsWebAuthn() ? (
                    <>
                        <div style={{ height: 20 }} />
                        {localize('passkeys.name', 'Passkey name')}
                        <Input
                            maxLength={50}
                            placeholder={localize(
                                'passkeys.name_placeholder',
                                'e.g. MacBook'
                            )}
                            value={this.state.name}
                            onChange={(e) =>
                                this.setState({ name: e.target.value })
                            }
                        />
                        <div style={{ height: 20 }} />
                        {localize(
                            'passkeys.current_password',
                            'Current password'
                        )}
                        <Input.Password
                            value={this.state.password}
                            onChange={(e) =>
                                this.setState({ password: e.target.value })
                            }
                        />
                        <div style={{ height: 20 }} />
                        <Row justify="end">
                            <Button
                                block={this.props.isMobile}
                                loading={this.state.isRegistering}
                                onClick={() => this.onRegisterClicked()}
                                type="primary"
                            >
                                {localize(
                                    'passkeys.register',
                                    'Register passkey'
                                )}
                            </Button>
                        </Row>
                    </>
                ) : (
                    <p>
                        {localize(
                            'passkeys.not_supported',
                            'This browser does not support passkeys.'
                        )}
                    </p>
                )}
            </div>
        )
    }
}
