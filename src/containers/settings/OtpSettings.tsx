import { CheckCircleOutlined } from '@ant-design/icons'
import { Button, Input, Modal, Row } from 'antd'
import { TwoFactorAuthResponse } from '../../models/IProFeatures'
import { localize } from '../../utils/Language'
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
                    {localize(
                        'settings.otp_authentication',
                        'Two Factor Authentication'
                    )}{' '}
                    {isCurrentlyEnabled ? (
                        <b>
                            {localize('settings.enabled', 'Enabled')}{' '}
                            <CheckCircleOutlined />
                        </b>
                    ) : (
                        <b>{localize('settings.disabled', 'Disabled')}</b>
                    )}
                </p>
                <Row justify="end">
                    {isCurrentlyEnabled ? (
                        <Button
                            type="dashed"
                            onClick={() => self.setEnableOtp(false)}
                        >
                            {localize(
                                'settings.disable_otp',
                                'Disable Two-Factor Authentication'
                            )}
                        </Button>
                    ) : (
                        <Button
                            type="default"
                            onClick={() => self.setEnableOtp(true)}
                        >
                            {localize(
                                'settings.enable_otp',
                                'Enable Two-Factor Authentication'
                            )}
                        </Button>
                    )}
                </Row>
                <Modal
                    title={localize(
                        'settings.enable_otp_verification',
                        'Enable OTP verification'
                    )}
                    open={!!self.state.otpPath}
                    onOk={() => {
                        if (!self.state.enteredToken) {
                            Toaster.toastInfo(
                                localize(
                                    'settings.enter_otp_code_first',
                                    'Enter OTP verification code first.'
                                )
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
                            {localize(
                                'settings.confirm_otp',
                                'Confirm OTP by entering the verification code'
                            )}
                        </p>
                        <Input
                            style={{ marginTop: 5 }}
                            addonBefore={localize(
                                'settings.otp_verification_code',
                                'OTP Verification Code'
                            )}
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
                            ? localize(
                                  'settings.otp_enabled_success',
                                  'Two factor authentication is now successfully enabled'
                              )
                            : localize(
                                  'settings.otp_disabled',
                                  'Two factor authentication is disabled'
                              )
                    )
                }
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false, enteredToken: '' })
            })
    }
}
