import { Button, Input, message, Row } from 'antd'
import { localize } from '../../utils/Language'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'

export default class ChangePass extends ApiComponent<
    {
        isMobile: boolean
    },
    { isLoading: boolean; old: string; new1: string; new2: string }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            isLoading: false,
            old: '',
            new1: '',
            new2: '',
        }
    }

    onChangePasswordClicked() {
        const self = this
        if (!this.state.new1) {
            message.error(
                localize(
                    'change_password.new_password_cannot_be_empty',
                    'New password cannot be empty'
                )
            )
            return
        }

        if (this.state.new1 !== this.state.new2) {
            message.error(
                localize(
                    'change_password.new_passwords_confirm_does_not_match',
                    'New passwords confirm does not match'
                )
            )
            return
        }

        this.setState({ isLoading: true })

        this.apiManager
            .changePass(this.state.old, this.state.new1)
            .then(function () {
                message.success(
                    localize(
                        'change_password.password_changed_successfully',
                        'Password changed successfully!'
                    )
                )
            })
            .then(function () {
                self.setState({ isLoading: false })
                return self.apiManager.loginAndSavePassword(self.state.new1)
            })
            .catch(Toaster.createCatcher())
    }

    render() {
        if (this.state.isLoading) {
            return <CenteredSpinner />
        }

        return (
            <div>
                {localize('change_password.old_password', 'Old Password')}
                <Input.Password
                    onChange={(e) => this.setState({ old: e.target.value })}
                />
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />
                {localize('change_password.new_password', 'New Password')}
                <Input.Password
                    maxLength={29}
                    onChange={(e) => this.setState({ new1: e.target.value })}
                />
                <div style={{ height: 20 }} />
                {localize(
                    'change_password.confirm_new_password',
                    'Confirm New Password'
                )}
                <Input.Password
                    maxLength={29}
                    onChange={(e) => this.setState({ new2: e.target.value })}
                />
                <div style={{ height: 40 }} />
                <Row justify="end">
                    <Button
                        block={this.props.isMobile}
                        onClick={() => this.onChangePasswordClicked()}
                        type="primary"
                    >
                        {localize(
                            'change_password.change_password',
                            'Change Password'
                        )}
                    </Button>
                </Row>
            </div>
        )
    }
}
