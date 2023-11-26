import { Button, Input, message, Row } from 'antd'
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
            message.error('New password cannot be empty')
            return
        }

        if (this.state.new1 !== this.state.new2) {
            message.error('New passwords confirm does not match')
            return
        }

        this.setState({ isLoading: true })

        this.apiManager
            .changePass(this.state.old, this.state.new1)
            .then(function () {
                message.success('Password changed successfully!')
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.apiManager.getAuthToken(self.state.new1)
                self.setState({ isLoading: false })
            })
    }

    render() {
        if (this.state.isLoading) {
            return <CenteredSpinner />
        }

        return (
            <div>
                Old Password
                <Input.Password
                    onChange={(e) => this.setState({ old: e.target.value })}
                />
                <div style={{ height: 20 }} />
                <hr />
                <div style={{ height: 20 }} />
                New Password
                <Input.Password
                    maxLength={30}
                    onChange={(e) => this.setState({ new1: e.target.value })}
                />
                <div style={{ height: 20 }} />
                Confirm New Password
                <Input.Password
                    maxLength={30}
                    onChange={(e) => this.setState({ new2: e.target.value })}
                />
                <div style={{ height: 40 }} />
                <Row justify="end">
                    <Button
                        block={this.props.isMobile}
                        onClick={() => this.onChangePasswordClicked()}
                        type="primary"
                    >
                        Change Password
                    </Button>
                </Row>
            </div>
        )
    }
}
