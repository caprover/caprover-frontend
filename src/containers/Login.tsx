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

const SAVE_METHOD: Array< Function > = []
SAVE_METHOD[NO_SESSION] = () => null
SAVE_METHOD[SESSION_STORAGE] =  StorageHelper.setAuthKeyInSessionStorage
SAVE_METHOD[LOCAL_STORAGE] =  StorageHelper.setAuthKeyInLocalStorage

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
        const methodSave = SAVE_METHOD[self.state.loginOption]
        this.apiManager
            .getAuthToken(password)
            .then(function () {
                const tokenString =  ApiManager.getAuthTokenString()
                methodSave(tokenString)
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
            <form onSubmit={(event) => {
                self.handleSubmit()
                event.preventDefault()
            }}>
                <Input.Password
                    required={true}
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
                        >
                            Login
                        </Button>
                    </Row>
                </div>
                <Collapse>
                    <Collapse.Panel header="Remember Me" key="1">
                        <Radio.Group
                            onChange={(e) => {
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
