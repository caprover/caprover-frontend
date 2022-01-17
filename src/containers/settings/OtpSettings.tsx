import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Input, Modal, Row } from 'antd'
import { TwoFactorAuthResponse } from '../../models/IProFeatures'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import OtpQr from './OtpQr'

export default class OtpSettings extends ApiComponent<
    { rootDomain: string },
    {
        apiData: TwoFactorAuthResponse | undefined
        isLoading: boolean
        enteredToken: string
        otpPath: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
            isLoading: true,
            enteredToken: '',
            otpPath: '',
        }
    }

    componentDidMount() {
        this.fetchContent()
    }

    fetchContent() {
        const self = this
        self.setState({ isLoading: true })
        self.apiManager
            .getOtpStatus()
            .then(function (resp) {
                self.setState({ apiData: resp })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    render() {
        const self = this

        const apiData = self.state.apiData
        if (!apiData || self.state.isLoading) return <CenteredSpinner />

        const isCurrentlyEnabled = self.state.apiData?.isEnabled

        return (
            <div>
                <p>
                    Two Factor Authentication{' '}
                    {isCurrentlyEnabled ? (
                        <b>
                            Enabled <CheckCircleOutlined />
                        </b>
                    ) : (
                        <b>Disabled</b>
                    )}
                </p>
                <Row justify="end">
                    {isCurrentlyEnabled ? (
                        <Button
                            type="dashed"
                            onClick={() => self.setEnableOtp(false)}
                        >
                            Disable Two-Factor Authentication
                        </Button>
                    ) : (
                        <Button
                            type="default"
                            onClick={() => self.setEnableOtp(true)}
                        >
                            Enable Two-Factor Authentication
                        </Button>
                    )}
                </Row>
                <Modal
                    title="Enable OTP verification"
                    visible={!!self.state.otpPath}
                    onOk={() => {
                        if (!self.state.enteredToken) {
                            Toaster.toastInfo(
                                'Enter OTP verification code first.'
                            )
                        } else {
                            self.setEnableOtp(true)
                            self.setState({ otpPath: '' })
                        }
                    }}
                    onCancel={() => {
                        self.setState({ enteredToken: '', otpPath: '' })
                    }}
                >
                    <div>
                        <OtpQr otpPath={self.state.otpPath} />
                        <p style={{ marginTop: 50 }}>
                            Confirm OTP by entering the verification code
                        </p>
                        <Input
                            style={{ marginTop: 5 }}
                            addonBefore="OTP Verification Code"
                            placeholder="123456"
                            value={self.state.enteredToken}
                            onChange={(e) => {
                                self.setState({
                                    enteredToken: `${e.target.value}`,
                                })
                            }}
                            autoFocus
                        />
                    </div>
                </Modal>
            </div>
        )
    }

    setEnableOtp(toEnable: boolean) {
        const self = this
        self.setState({ isLoading: true })
        return Promise.resolve() //
            .then(function () {
                return self.apiManager.setOtpStatus({
                    enabled: toEnable,
                    token: self.state.enteredToken,
                })
            })
            .then(function (resp) {
                self.setState({ apiData: resp })
                if (resp.otpPath && !self.state.enteredToken) {
                    self.setState({ otpPath: resp.otpPath })
                }

                if (toEnable === resp.isEnabled) {
                    Toaster.toastSuccess(
                        toEnable
                            ? 'Two factor authentication is now successfully enabled'
                            : 'Two factor authentication is disabled'
                    )
                }
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false, enteredToken: '' })
            })
    }
}
