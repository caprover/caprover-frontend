import { CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { Button, Checkbox, Col, Popover, Row, Switch } from 'antd'
import { IHashMapGeneric } from '../../models/IHashMapGeneric'
import {
    IProConfig,
    ProAlertActionType,
    ProAlertConfig,
} from '../../models/IProFeatures'
import Toaster from '../../utils/Toaster'
import Utils from '../../utils/Utils'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import OtpSettings from './OtpSettings'

export default class ProFeaturesConfigs extends ApiComponent<
    { rootDomain: string; onRefreshRequested: () => void },
    {
        proConfigs: IProConfig | undefined
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            proConfigs: undefined,
        }
    }

    fetchContent() {
        const self = this
        self.setState({ proConfigs: undefined })

        Promise.resolve()
            .then(function () {
                return self.apiManager.getProConfigs()
            })
            .then(function (result) {
                self.setState({
                    proConfigs: result.proConfigs,
                })
            })
            .catch(Toaster.createCatcher())
    }

    componentDidMount() {
        this.fetchContent()
    }

    render() {
        const self = this

        const proConfigs = self.state.proConfigs

        if (!proConfigs) {
            return <CenteredSpinner />
        }

        const baseConfigs: IHashMapGeneric<{
            text: string
            description: string
        }> = {}

        const alerts: IHashMapGeneric<{
            text: string
            description: string
        }> = {
            UserLoggedIn: {
                text: 'Login email alerts',
                description: 'Get notified when someone logs in',
            },
            AppBuildSuccessful: {
                text: 'Build success email alerts',
                description: 'Get notified when build succeeds',
            },
            AppBuildFailed: {
                text: 'Build failures email alerts',
                description: 'Get notified when build fails',
            },
        }

        return (
            <div>
                {Object.keys(baseConfigs).map((key) =>
                    self.createSwitch(
                        key,
                        baseConfigs[key].text,
                        baseConfigs[key].description
                    )
                )}

                <div style={{ height: 20 }} />

                {Object.keys(alerts).map((key) =>
                    self.createAlertRow(
                        key,
                        alerts[key].text,
                        alerts[key].description
                    )
                )}

                <Row justify="end">
                    <Button
                        type="primary"
                        onClick={() => self.updateConfig(proConfigs)}
                    >
                        Save
                    </Button>
                </Row>
                <hr style={{ margin: 30 }} />
                <OtpSettings rootDomain={self.props.rootDomain} />
            </div>
        )
    }
    createAlertRow(key: string, text: string, description: string): any {
        const self = this
        const proConfigs = self.state.proConfigs as IProConfig
        return (
            <div
                key={key}
                style={{
                    marginBottom: 15,
                }}
            >
                <Row>
                    <Col span={16}>
                        <Popover
                            placement="bottom"
                            content={
                                <div
                                    style={{
                                        maxWidth: 300,
                                        whiteSpace: 'pre-line',
                                    }}
                                >
                                    {description}
                                </div>
                            }
                        >
                            {text}
                        </Popover>
                    </Col>
                    <Col span={8}>
                        <div>
                            <Checkbox
                                defaultChecked={
                                    proConfigs.alerts.filter((it) => {
                                        return (
                                            it.event === key &&
                                            it.action.actionType ===
                                                ProAlertActionType.email
                                        )
                                    }).length > 0
                                }
                                onChange={(e) => {
                                    let newConfigs =
                                        Utils.copyObject(proConfigs)
                                    const checked = e.target.checked

                                    newConfigs.alerts =
                                        newConfigs.alerts.filter((it) => {
                                            if (
                                                it.event === key &&
                                                it.action.actionType ===
                                                    ProAlertActionType.email
                                            ) {
                                                // remove anyways (will later add if it's enabled)
                                                return false
                                            }
                                            return true
                                        })

                                    if (checked) {
                                        const newAlert: ProAlertConfig = {
                                            event: key as any,
                                            action: {
                                                actionType:
                                                    ProAlertActionType.email,
                                            },
                                        }
                                        newConfigs.alerts.push(newAlert)
                                    }
                                    self.setState({ proConfigs: newConfigs })
                                }}
                            >
                                Email
                            </Checkbox>
                        </div>
                    </Col>
                </Row>
            </div>
        )
    }

    createSwitch(key: string, text: string, description: string) {
        const self = this
        const proConfigs = self.state.proConfigs as any
        return (
            <div
                key={key}
                style={{
                    marginBottom: 15,
                }}
            >
                <Switch
                    style={{ marginRight: 10, marginBottom: 3 }}
                    size="small"
                    checkedChildren={<CheckOutlined />}
                    unCheckedChildren={<CloseOutlined />}
                    checked={!!proConfigs[key]}
                    onChange={(checked) => {
                        const newConfigs = Utils.copyObject(proConfigs)
                        newConfigs[key] = !!checked
                        self.setState({ proConfigs: newConfigs })
                    }}
                />

                <Popover
                    placement="bottom"
                    content={
                        <div
                            style={{
                                maxWidth: 300,
                                whiteSpace: 'pre-line',
                            }}
                        >
                            {description}
                        </div>
                    }
                >
                    {text}
                </Popover>
            </div>
        )
    }

    updateConfig(proConfigs: IProConfig) {
        const self = this
        return Promise.resolve() //
            .then(function () {
                return self.apiManager.setProConfigs(proConfigs)
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.fetchContent()
                self.props.onRefreshRequested()
            })
    }
}
