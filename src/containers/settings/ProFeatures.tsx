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
            <div>
                <Card
                    style={{
                        height: '100%',
                        boxShadow: '1px 1px 20px #c6c6c6',
                    }}
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
            height: '160px',
            color: '#fff',
            lineHeight: '160px',
            background: '#364d79',
            textAlign: 'center' as 'center',
        }

        return (
            <div>
                <p>
                    Upgrade to <b>CapRover PRO</b> to take advantage of premium
                    features!
                </p>
                <ul>
                    {`Two-Factor Authentication for better security
                    Login email alerts
                    Build success and failure email alerts
                    Last not least, support active development of OpenSource Software!`
                        .split('\n')
                        .map((it) => (
                            <li>{it.trim()}</li>
                        ))}
                </ul>

                <Carousel autoplay>
                    <div>
                        <h3 style={contentStyle}>
                            Create a PRO account using an OAuth provider
                            (Google, Github, etc)
                        </h3>
                    </div>
                    <div>
                        <h3 style={contentStyle}>Sign-up for PRO membership</h3>
                    </div>
                    <div>
                        <h3 style={contentStyle}>Enjoy Premium features!</h3>
                    </div>
                </Carousel>
                <div style={{ height: 30 }} />
                <p>
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
                </p>

                <Modal
                    title="Enter API Key"
                    visible={self.state.apiKeyModalVisible}
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
