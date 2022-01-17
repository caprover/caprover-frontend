import { Row } from 'antd'
import qrcode from 'qrcode'
import { Component } from 'react'
import Logger from '../../utils/Logger'
import NewTabLink from '../global/NewTabLink'

export default class OtpQr extends Component<
    {
        otpPath: string
    },
    {
        imageUrl: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            imageUrl: '',
        }
    }
    componentDidMount() {
        const self = this

        qrcode.toDataURL(self.props.otpPath, (err: any, imageUrl: any) => {
            if (err) {
                Logger.error(err)
                return
            }
            self.setState({ imageUrl: imageUrl })
        })
    }

    render() {
        const self = this
        return (
            <div
                style={
                    {
                        //
                    }
                }
            >
                <Row justify="center">
                    <pre>{self.props.otpPath}</pre>

                    <p
                        style={{
                            margin: 10,
                        }}
                    >
                        Scan the code using an Authenticator app. CapRover
                        recommends{' '}
                        <NewTabLink url="https://authy.com/download/">
                            <b>Authy</b>
                        </NewTabLink>
                    </p>
                    <img
                        alt="QR Code"
                        src={self.state.imageUrl}
                        height={200}
                        width={200}
                    />
                </Row>
            </div>
        )
    }
}
