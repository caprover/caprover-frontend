import { LockOutlined } from '@ant-design/icons'
import { Button, Card, Collapse, Input, Radio, Row } from 'antd'
import React from 'react'
import { Redirect, RouteComponentProps } from 'react-router'
import ApiManager from '../api/ApiManager'
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
        }
    }

    componentDidMount() {
        if (super.componentDidMount) super.componentDidMount()

        Utils.deleteAllCookies()
    }

    onLoginRequested(password: string) {
        const self = this
        this.apiManager
            .getAuthToken(password)
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
            .catch(Toaster.createCatcher())
    }

    render() {
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
                    <Card title="CapRover Login" style={{ width: 350 }}>
                        <NormalLoginForm
                            onLoginRequested={(
                                password: string,
                                loginOption: number
                            ) => {
                                self.setState({ loginOption })
                                self.onLoginRequested(password)
                            }}
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

class NormalLoginForm extends React.Component<
    any,
    {
        loginOption: number
        passwordEntered: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            loginOption: NO_SESSION,
            passwordEntered: ``,
        }
    }

    handleSubmit = () => {
        const self = this
        self.props.onLoginRequested(
            self.state.passwordEntered,
            self.state.loginOption
        )
    }

    render() {
        const self = this
        return (
            <div>
                <Input.Password
                    onKeyDown={(key) => {
                        if (key.keyCode === 13) {
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
                <div style={{ marginTop: 20, marginBottom: 20 }}>
                    <Row justify="end">
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="login-form-button"
                            onClick={() => {
                                self.handleSubmit()
                            }}
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
            </div>
        )
    }
}
