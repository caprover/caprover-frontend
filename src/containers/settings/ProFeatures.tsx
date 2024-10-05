import { CrownTwoTone } from '@ant-design/icons'
import { Button, Card, Carousel, Input, Modal, Row } from 'antd'
import React from 'react'
import { IProFeatures } from '../../models/IProFeatures'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import NewTabLink from '../global/NewTabLink'
import ProFeaturesConfigs from './ProFeaturesConfigs'

export default class ProFeatures extends ApiComponent<
    {
        isMobile: boolean
    },
    {
        isLoading: boolean
        apiKeyConnecting: boolean
        apiData: IProFeatures | undefined
        apiKeyModalVisible: boolean
        enteredApiKey: string
        rootDomain: string
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            apiKeyModalVisible: false,
            apiKeyConnecting: false,
            isLoading: false,
            apiData: undefined,
            enteredApiKey: '',
            rootDomain: '',
        }
    }

    componentDidMount() {
        this.fetchContent()
    }

    fetchContent() {
        const self = this
        self.setState({ isLoading: true })

        Promise.resolve()
            .then(function () {
                const captainInfoPromise = self.apiManager.getCaptainInfo()
                const proFeaturesRequest = self.apiManager.getProFeaturesState()
                return Promise.all([captainInfoPromise, proFeaturesRequest])
            })

            .then(function (result) {
                const resultTypeChecked: IProFeatures =
                    result[1].proFeaturesState
                self.setState({
                    apiData: resultTypeChecked,
                    rootDomain: result[0].rootDomain,
                })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    render() {
        const self = this

        const apiData = self.state.apiData
        if (!apiData || !apiData.isFeatureFlagEnabled) return <></>

        return (
            <div style={{ animation: 'fadeIn 0.5s ease-in' }}>
                <style>
                    {`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    `}
                </style>
                <Card
                    title={
                        <div style={{}}>
                            <a
                                href="https://pro.caprover.com"
                                target="_blank"
                                rel="noreferrer"
                            >
                                <b>CapRover PRO</b>
                            </a>
                            &nbsp;&nbsp;
                            <CrownTwoTone twoToneColor="#c27b00" />
                        </div>
                    }
                >
                    {apiData.isSubscribed ? (
                        <ProFeaturesConfigs
                            rootDomain={self.state.rootDomain}
                            onRefreshRequested={() => {
                                self.fetchContent()
                            }}
                        />
                    ) : (
                        self.createUpgradeToPro()
                    )}
                </Card>
            </div>
        )
    }

    createUpgradeToPro(): React.ReactNode {
        const self = this

        const contentStyle = {
            paddingLeft: '20px',
            paddingRight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10px',
            fontSize: '1.17em', // This is the default font size for h3
            minHeight: '160px',
            color: '#fff',
            background:
                'radial-gradient(circle at center, #364d79 0%, #283E5B 50%, #1A2338 100%)',
            textAlign: 'center' as 'center',
        }

        return (
            <div>
                <div>
                    Upgrade to <b>CapRover PRO</b> to take advantage of premium
                    features!
                </div>
                <ul>
                    {`Two-Factor Authentication for better security
                    Login email alerts
                    Build success and failure email alerts
                    Last not least, support active development of OpenSource Software!`
                        .split('\n')
                        .map((it) => (
                            <li key={it.trim()}>{it.trim()}</li>
                        ))}
                </ul>
                <Carousel autoplay>
                    <div>
                        <div style={contentStyle}>
                            Create a PRO account using an OAuth provider
                            (Google, Github, etc)
                        </div>
                    </div>
                    <div>
                        <div style={contentStyle}>
                            Sign-up for PRO membership
                        </div>
                    </div>
                    <div>
                        <div style={contentStyle}>Enjoy Premium features!</div>
                    </div>
                </Carousel>
                <div style={{ height: 30 }} />
                <Row justify="end">
                    <Button
                        style={{
                            marginRight: 30,
                        }}
                        size="large"
                        onClick={() => {
                            self.setState({ apiKeyModalVisible: true })
                        }}
                    >
                        Enter API Key
                    </Button>
                    <NewTabLink url="https://pro.caprover.com">
                        <Button
                            type="primary"
                            size="large"
                            style={{
                                background: '#DAA520',
                                borderColor: '#dbae3b',
                            }}
                        >
                            <b>Upgrade NOW</b>
                        </Button>
                    </NewTabLink>
                </Row>
                <Modal
                    title="Enter API Key"
                    open={self.state.apiKeyModalVisible}
                    okText="Connect API Key"
                    onOk={() => {
                        self.setState({ apiKeyConnecting: true })

                        self.apiManager
                            .setProApiKey(self.state.enteredApiKey)
                            .then(function (ignore) {
                                self.setState({ apiKeyModalVisible: false })
                            })
                            .catch(Toaster.createCatcher())
                            .then(function () {
                                self.setState({ apiKeyConnecting: false })
                                self.fetchContent()
                            })
                    }}
                    confirmLoading={self.state.apiKeyConnecting}
                    onCancel={() => {
                        self.setState({ apiKeyModalVisible: false })
                    }}
                >
                    <div>
                        <p>Enter the purchase API Key here</p>

                        <Input
                            placeholder="apikey_123456789"
                            type="email"
                            onChange={(event) =>
                                self.setState({
                                    enteredApiKey: (
                                        event.target.value || ''
                                    ).trim(),
                                })
                            }
                        />
                    </div>
                </Modal>
            </div>
        )
    }
}
