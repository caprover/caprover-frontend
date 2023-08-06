import { LockOutlined } from '@ant-design/icons'
import { Button, Card, Collapse, Input, Radio, Row } from 'antd'
import React, { ReactComponentElement } from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import ApiManager from '../api/ApiManager'
import ErrorFactory from '../utils/ErrorFactory'
import StorageHelper from '../utils/StorageHelper'
import Toaster from '../utils/Toaster'
import Utils from '../utils/Utils'
import ApiComponent from './global/ApiComponent'

const NO_SESSION = 1
const SESSION_STORAGE = 2
const LOCAL_STORAGE = 3

export default class Login extends ApiComponent<RouteComponentProps<any>, any> {
    constructor(props: any) {
        super(props)
        this.state = {
            loginOption: NO_SESSION,
            hasOtp: false,
        }
    }

    componentDidMount(): void {
        if (super.componentDidMount) {
            super.componentDidMount()
        }
        Utils.deleteAllCookies()
    }

    onLoginRequested(password: string, otp: string) {
        const self = this
        this.apiManager
            .getAuthToken(password, otp)
            .then(function () {
                if (self.state.loginOption === SESSION_STORAGE) {
                    StorageHelper.setAuthKeyInSessionStorage(
                        ApiManager.getAuthTokenString()
                    )
                } else if (self.state.loginOption === LOCAL_STORAGE) {
                    StorageHelper.setAuthKeyInLocalStorage(
                        ApiManager.getAuthTokenString()
                    )
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

    render(): ReactComponentElement<any> {
        const self = this

        if (ApiManager.isLoggedIn()) return <Redirect to="/" />

        return (
            <div>
                <div
                    style={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%,-50%)',
                    }}
                >
                    <Card title="CapRover Login" style={{ width: 380 }}>
                        <NormalLoginForm
                            onLoginRequested={(
                                password: string,
                                otp: string,
                                loginOption: number
                            ) => {
                                self.setState({ loginOption })
                                self.onLoginRequested(password, otp)
                            }}
                            hasOtp={self.state.hasOtp}
                        />
                    </Card>
                </div>
            </div>
        )
    }
}

const radioStyle = {
    display: 'block',
    height: '30px',
    lineHeight: '30px',
}

let lastSubmittedTime = 0

class NormalLoginForm extends React.Component<
    any,
    {
        loginOption: number
        passwordEntered: string
        otpEntered: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            loginOption: NO_SESSION,
            passwordEntered: ``,
            otpEntered: ``,
        }
    }

    handleSubmit = (e?: React.FormEvent): void => {
        e?.preventDefault()
        const now = new Date().getTime()
        if (now - lastSubmittedTime < 300) return // avoid duplicate clicks
        lastSubmittedTime = now
        const self = this
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
                    placeholder="Password"
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
                                autoFocus
                            />
                        </Row>
                    </div>
                ) : undefined}

                <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <Row justify="end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-form-button"
                        >
                            Login
                        </Button>
                    </Row>
                </div>
                <Collapse>
                    <Collapse.Panel header="Remember Me" key="1">
                        <Radio.Group
                            onChange={(e) => {
                                console.log(e.target.value)
                                self.setState({
                                    loginOption: e.target.value,
                                })
                            }}
                            value={self.state.loginOption}
                        >
                            <Radio style={radioStyle} value={NO_SESSION}>
                                No session persistence (Most Secure)
                            </Radio>
                            <Radio style={radioStyle} value={SESSION_STORAGE}>
                                Use sessionStorage
                            </Radio>
                            <Radio style={radioStyle} value={LOCAL_STORAGE}>
                                Use localStorage (Most Persistent)
                            </Radio>
                        </Radio.Group>
                    </Collapse.Panel>
                </Collapse>
            </form>
        )
    }
}
