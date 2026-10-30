import { KeyOutlined, LockOutlined } from '@ant-design/icons'
import { browserSupportsWebAuthn } from '@simplewebauthn/browser'
import { Button, Card, Collapse, Input, Layout, Radio, Row } from 'antd'
import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import ApiManager from '../api/ApiManager'
import ErrorFactory from '../utils/ErrorFactory'
import { isLanguageEnabled, localize } from '../utils/Language'
import Logger from '../utils/Logger'
import StorageHelper from '../utils/StorageHelper'
import Toaster from '../utils/Toaster'
import Utils from '../utils/Utils'
import ApiComponent from './global/ApiComponent'
import LanguageSelector from './global/LanguageSelector'

export const NO_SESSION = 1
export const SESSION_STORAGE = 2
export const LOCAL_STORAGE = 3

const isRememberMeOption = (option: number | undefined): option is number =>
    option === NO_SESSION ||
    option === SESSION_STORAGE ||
    option === LOCAL_STORAGE

export default class Login extends ApiComponent<RouteComponentProps<any>, any> {
    constructor(props: any) {
        super(props)
        this.state = {
            hasOtp: false,
        }
    }

    componentDidMount(): void {
        if (super.componentDidMount) {
            super.componentDidMount()
        }
        Utils.deleteAllCookies()
    }

    onLoginRequested(password: string, otp: string, loginOption: number) {
        Logger.dev(`Submitting login with Remember Me option: ${loginOption}`)
        this.completeLogin(
            this.apiManager.loginAndSavePassword(password, otp),
            loginOption
        )
    }

    onPasskeyLoginRequested(otp: string, loginOption: number) {
        Logger.dev(
            `Submitting passkey login with Remember Me option: ${loginOption}`
        )
        this.completeLogin(this.apiManager.loginWithPasskey(otp), loginOption)
    }

    completeLogin(loginPromise: Promise<string>, loginOption: number) {
        const self = this
        loginPromise
            .then(function (token) {
                Logger.dev(
                    `Login succeeded with Remember Me option: ${loginOption}`
                )
                if (loginOption === SESSION_STORAGE) {
                    StorageHelper.setAuthKeyInSessionStorage(token)
                } else if (loginOption === LOCAL_STORAGE) {
                    StorageHelper.setAuthKeyInLocalStorage(token)
                }
                self.props.history.push('/')
            })
            .catch((error) => {
                if (
                    error.captainStatus ===
                    ErrorFactory.STATUS_ERROR_OTP_REQUIRED
                ) {
                    self.setState({
                        hasOtp: true,
                    })
                    Toaster.toastInfo('Enter OTP Verification Code')
                } else {
                    throw error
                }
            })
            .catch(Toaster.createCatcher())
    }

    render() {
        const self = this

        if (ApiManager.isLoggedIn()) return <Redirect to="/" />

        return (
            <Layout className="full-screen">
                <Row justify="center" align="middle" className="full-screen">
                    <Card
                        title={localize(
                            'login_form.cap_rover',
                            'CapRover Login'
                        )}
                        style={{ width: 450 }}
                        extra={
                            isLanguageEnabled ? (
                                <LanguageSelector forceReload={true} />
                            ) : undefined
                        }
                    >
                        <NormalLoginForm
                            onLoginRequested={(
                                password: string,
                                otp: string,
                                loginOption: number
                            ) => {
                                self.onLoginRequested(
                                    password,
                                    otp,
                                    loginOption
                                )
                            }}
                            onPasskeyLoginRequested={(
                                otp: string,
                                loginOption: number
                            ) => {
                                self.onPasskeyLoginRequested(otp, loginOption)
                            }}
                            hasOtp={self.state.hasOtp}
                        />
                    </Card>
                </Row>
            </Layout>
        )
    }
}

const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
}

let lastSubmittedTime = 0

export class NormalLoginForm extends React.Component<
    any,
    {
        loginOption: number
        passwordEntered: string
        otpEntered: string
    }
> {
    isDemo: boolean = false
    constructor(props: any) {
        super(props)

        try {
            const urlSearchParams = new URLSearchParams(window.location.search)
            // @ts-ignore
            const params = Object.fromEntries(urlSearchParams.entries())
            this.isDemo = !!params.demo
        } catch (e) {
            Logger.dev('Unable to parse login URL parameters')
        }

        const savedLoginOption =
            StorageHelper.getRememberMeOptionFromLocalStorage()
        const loginOption = isRememberMeOption(savedLoginOption)
            ? savedLoginOption
            : NO_SESSION
        Logger.dev(`Loaded Remember Me option: ${loginOption}`)

        this.state = {
            loginOption,
            passwordEntered: this.getDefaultPassword(),
            otpEntered: ``,
        }
    }

    handlePasskeyLogin = (): void => {
        const now = new Date().getTime()
        if (now - lastSubmittedTime < 300) return // avoid duplicate clicks
        lastSubmittedTime = now
        this.props.onPasskeyLoginRequested(
            this.state.otpEntered,
            this.state.loginOption
        )
    }

    handleSubmit = (e?: React.FormEvent): void => {
        e?.preventDefault()
        const now = new Date().getTime()
        if (now - lastSubmittedTime < 300) return // avoid duplicate clicks
        lastSubmittedTime = now
        const self = this
        Logger.dev(
            `Submitting form with Remember Me option: ${self.state.loginOption}`
        )
        self.props.onLoginRequested(
            self.state.passwordEntered,
            self.state.otpEntered,
            self.state.loginOption
        )
    }

    render() {
        const self = this
        return (
            <form onSubmit={this.handleSubmit}>
                <Input.Password
                    defaultValue={this.getDefaultPassword()}
                    required
                    onKeyDown={(key) => {
                        if (
                            `${key.key}`.toLocaleLowerCase() === 'enter' ||
                            `${key.code}`.toLocaleLowerCase() === 'enter' ||
                            key.keyCode === 13
                        ) {
                            self.handleSubmit()
                        }
                    }}
                    prefix={
                        <LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />
                    }
                    onChange={(e) => {
                        self.setState({ passwordEntered: `${e.target.value}` })
                    }}
                    placeholder={localize('login_form.password', 'Password')}
                    autoFocus
                />
                {self.props.hasOtp ? (
                    <div style={{ marginTop: 20, marginBottom: 20 }}>
                        <Row justify="end">
                            <Input
                                onKeyDown={(key) => {
                                    if (
                                        `${key.key}`.toLocaleLowerCase() ===
                                            'enter' ||
                                        `${key.code}`.toLocaleLowerCase() ===
                                            'enter' ||
                                        key.keyCode === 13
                                    ) {
                                        self.handleSubmit()
                                    }
                                }}
                                addonBefore="OTP Verification Code"
                                placeholder="123456"
                                value={self.state.otpEntered}
                                onChange={(e) => {
                                    self.setState({
                                        otpEntered: `${e.target.value}`,
                                    })
                                }}
                                autoComplete="one-time-code"
                                autoFocus
                            />
                        </Row>
                    </div>
                ) : undefined}

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <Row justify="end">
                        {self.props.onPasskeyLoginRequested &&
                        browserSupportsWebAuthn() ? (
                            <Button
                                htmlType="button"
                                icon={<KeyOutlined />}
                                style={{ marginInlineEnd: 10 }}
                                onClick={self.handlePasskeyLogin}
                            >
                                {localize(
                                    'login_form.login_with_passkey',
                                    'Sign in with passkey'
                                )}
                            </Button>
                        ) : undefined}
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-form-button"
                        >
                            {localize('login_form.login', 'Login')}
                        </Button>
                    </Row>
                </div>
                <Collapse>
                    <Collapse.Panel
                        header={localize(
                            'login_form.remember_me',
                            'Remember Me'
                        )}
                        key="1"
                    >
                        <Radio.Group
                            onChange={(e) => {
                                const loginOption = Number(e.target.value)
                                if (!isRememberMeOption(loginOption)) {
                                    Logger.dev(
                                        `Ignoring invalid Remember Me option: ${loginOption}`
                                    )
                                    return
                                }
                                Logger.dev(
                                    `Remember Me option changed to: ${loginOption}`
                                )
                                StorageHelper.setRememberMeOptionInLocalStorage(
                                    loginOption
                                )
                                self.setState({
                                    loginOption,
                                })
                            }}
                            value={self.state.loginOption}
                        >
                            <Radio style={radioStyle} value={NO_SESSION}>
                                {localize(
                                    'login_form.no_session_persistence',
                                    'No session persistence (Most Secure)'
                                )}
                            </Radio>
                            <Radio style={radioStyle} value={SESSION_STORAGE}>
                                {localize(
                                    'login_form.use_session_storage',
                                    'Use sessionStorage'
                                )}
                            </Radio>
                            <Radio style={radioStyle} value={LOCAL_STORAGE}>
                                {localize(
                                    'login_form.use_local_storage',
                                    'Use localStorage (Most Persistent)'
                                )}
                            </Radio>
                        </Radio.Group>
                    </Collapse.Panel>
                </Collapse>
            </form>
        )
    }

    private getDefaultPassword(): string {
        return this.isDemo ? 'captain42' : ''
    }
}
