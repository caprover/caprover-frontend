import { EditFilled, EditOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button, Col, Input, Row, Switch, Tag, Tooltip } from 'antd'
import { Component, Fragment } from 'react'
import { IHashMapGeneric } from '../../../models/IHashMapGeneric'
import Utils from '../../../utils/Utils'
import NewTabLink from '../../global/NewTabLink'
import { IAppEnvVar } from '../AppDefinition'
import { AppDetailsTabProps } from './AppDetails'

export default class AppConfigs extends Component<
    AppDetailsTabProps,
    {
        dummyVar: undefined
        tagsEditMode: boolean
        envVarBulkEdit: boolean
        envVarBulkVals: string
        forceEditableNodeId: boolean
        forceEditableInstanceCount: boolean
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            dummyVar: undefined,
            forceEditableInstanceCount: false,
            tagsEditMode: false,
            envVarBulkEdit: false,
            envVarBulkVals: '',
            forceEditableNodeId: false,
        }
    }

    // Copied from https://github.com/motdotla/dotenv/blob/master/lib/main.js
    parseEnvVars(src: string) {
        const obj: IHashMapGeneric<string> = {}

        // convert Buffers before splitting into lines and processing
        src.toString()
            .split('\n')
            .forEach(function (line, idx) {
                // matching "KEY' and 'VAL' in 'KEY=VAL'
                const keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
                // matched?
                if (!!keyValueArr) {
                    const key = keyValueArr[1]

                    // default undefined or missing values to empty string
                    let value = keyValueArr[2] || ''

                    // expand newlines in quoted values
                    const len = value ? value.length : 0
                    if (
                        len > 0 &&
                        value.charAt(0) === '"' &&
                        value.charAt(len - 1) === '"'
                    ) {
                        value = value.replace(/\\n/gm, '\n')
                    }

                    // remove any surrounding quotes and extra spaces
                    value = value.replace(/(^['"]|['"]$)/g, '').trim()

                    obj[key] = value
                }
            })

        return obj
    }

    convertEnvVarsToBulk(envVars: IAppEnvVar[]) {
        return envVars
            .map((e) => {
                let val = e.value
                if (val.indexOf('\n') >= 0) {
                    val = `"${val.split('\n').join('\\n')}"`
                }
                return `${e.key}=${val}`
            })
            .join('\n')
    }

    createEnvVarSection() {
        const self = this
        const envVars = this.props.apiData.appDefinition.envVars || []

        if (self.state.envVarBulkEdit) {
            return (
                <div>
                    <Row style={{ paddingBottom: 12 }}>
                        <Col span={24}>
                            <Input.TextArea
                                className="code-input"
                                placeholder={'key1=value1\nkey2=value2'}
                                rows={7}
                                value={
                                    self.state.envVarBulkVals
                                        ? self.state.envVarBulkVals
                                        : self.convertEnvVarsToBulk(envVars)
                                }
                                onChange={(e) => {
                                    const newApiData = Utils.copyObject(
                                        self.props.apiData
                                    )
                                    const keyVals = self.parseEnvVars(
                                        e.target.value
                                    )
                                    const envVars: IAppEnvVar[] = []
                                    Object.keys(keyVals).forEach((k) => {
                                        envVars.push({
                                            key: k,
                                            value: keyVals[k],
                                        })
                                    })
                                    newApiData.appDefinition.envVars = envVars
                                    self.props.updateApiData(newApiData)
                                    self.setState({
                                        envVarBulkVals: e.target.value,
                                    })
                                }}
                            />
                        </Col>
                    </Row>
                </div>
            )
        }

        const rows = envVars.map((value, index) => {
            return (
                <Row style={{ paddingBottom: 12 }} key={`${index}`}>
                    <Col span={8}>
                        <Input
                            className="code-input"
                            placeholder="key"
                            value={value.key}
                            type="text"
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    self.props.apiData
                                )
                                newApiData.appDefinition.envVars[index].key =
                                    e.target.value
                                self.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                    <Col style={{ paddingLeft: 12 }} span={16}>
                        <Input.TextArea
                            className="code-input"
                            placeholder="value"
                            rows={1}
                            value={value.value}
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    self.props.apiData
                                )
                                newApiData.appDefinition.envVars[index].value =
                                    e.target.value
                                self.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                </Row>
            )
        })

        return (
            <div>
                {rows}

                <br />

                <Button
                    block={this.props.isMobile}
                    type="default"
                    onClick={() => self.addEnvVarClicked()}
                >
                    Add Key/Value Pair
                </Button>
            </div>
        )
    }

    createPortRows() {
        const self = this
        const ports = this.props.apiData.appDefinition.ports || []
        return ports.map((value, index) => {
            return (
                <Row style={{ paddingBottom: 12 }} key={`${index}`}>
                    <Col span={12}>
                        <Tooltip title="Make sure the port is not already used!">
                            <Input
                                addonBefore="Server Port"
                                placeholder="5050"
                                value={
                                    value.hostPort ? value.hostPort + '' : ''
                                }
                                type="number"
                                onChange={(e) => {
                                    const newApiData = Utils.copyObject(
                                        self.props.apiData
                                    )
                                    const p = Number(e.target.value.trim())
                                    newApiData.appDefinition.ports[
                                        index
                                    ].hostPort = p > 0 ? p : 0 // to avoid NaN
                                    self.props.updateApiData(newApiData)
                                }}
                            />
                        </Tooltip>
                    </Col>
                    <Col style={{ paddingLeft: 12 }} span={12}>
                        <Input
                            addonBefore="Container Port"
                            placeholder="6060"
                            value={
                                value.containerPort
                                    ? value.containerPort + ''
                                    : ''
                            }
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    self.props.apiData
                                )
                                const p = Number(e.target.value.trim())
                                newApiData.appDefinition.ports[
                                    index
                                ].containerPort = p > 0 ? p : 0 // to avoid NaN
                                self.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                </Row>
            )
        })
    }

    createVolRows() {
        const self = this
        const volumes = this.props.apiData.appDefinition.volumes || []
        return volumes.map((value, index) => {
            return (
                <Row style={{ paddingBottom: 12 }} key={`${index}`}>
                    <Col span={8}>
                        <Input
                            addonBefore="Path in App"
                            className="code-input"
                            placeholder="/var/www/html"
                            value={value.containerPath}
                            type="text"
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    self.props.apiData
                                )
                                newApiData.appDefinition.volumes[
                                    index
                                ].containerPath = e.target.value
                                self.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                    <Col
                        style={{ paddingLeft: 12 }}
                        span={8}
                        className={value.hostPath ? 'hide-on-demand' : ''}
                    >
                        <Input
                            addonBefore="Label"
                            className="code-input"
                            placeholder="some-name"
                            value={value.volumeName}
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    self.props.apiData
                                )
                                newApiData.appDefinition.volumes[
                                    index
                                ].volumeName = e.target.value
                                self.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>

                    <Col
                        style={{ paddingLeft: 12 }}
                        span={8}
                        className={!value.hostPath ? 'hide-on-demand' : ''}
                    >
                        <Tooltip title="IMPORTANT: Ensure Host Path exists before assigning it here">
                            <Input
                                addonBefore="Path on Host"
                                className="code-input"
                                placeholder="/host/path/exists"
                                value={value.hostPath}
                                onChange={(e) => {
                                    const newApiData = Utils.copyObject(
                                        self.props.apiData
                                    )
                                    newApiData.appDefinition.volumes[
                                        index
                                    ].hostPath = e.target.value
                                    self.props.updateApiData(newApiData)
                                }}
                            />
                        </Tooltip>
                    </Col>
                    <Col style={{ paddingLeft: 12 }} span={8}>
                        <Button
                            type="dashed"
                            onClick={() => {
                                const newApiData = Utils.copyObject(
                                    self.props.apiData
                                )
                                newApiData.appDefinition.volumes[
                                    index
                                ].hostPath = newApiData.appDefinition.volumes[
                                    index
                                ].hostPath
                                    ? ''
                                    : '/'
                                self.props.updateApiData(newApiData)
                            }}
                        >
                            {value.hostPath
                                ? 'Let CapRover manage path'
                                : 'Set specific host path'}
                        </Button>
                    </Col>
                </Row>
            )
        })
    }

    createVolSection() {
        const self = this
        const app = this.props.apiData!.appDefinition

        if (!app.hasPersistentData) return <div />

        return (
            <div>
                <h4>
                    Persistent Directories &nbsp;
                    <NewTabLink url="https://caprover.com/docs/app-configuration.html#persistent-or-not">
                        <InfoCircleOutlined />
                    </NewTabLink>
                </h4>
                <div
                    className={
                        app.volumes && !!app.volumes.length
                            ? 'hide-on-demand'
                            : ''
                    }
                >
                    <i>
                        Currently, this app does not have any persistent
                        directories.
                    </i>
                </div>

                {this.createVolRows()}
                <br />
                <Button type="default" onClick={() => this.addVolumeClicked()}>
                    Add Persistent Directory
                </Button>
                <br />
                <br />
                <br />

                <Row>
                    <Col
                        span={6}
                        style={{ minWidth: this.props.isMobile ? '100%' : 300 }}
                    >
                        <Tooltip title="Leave empty for automatic placement">
                            <Input
                                addonBefore="Node ID"
                                className="code-input"
                                value={app.nodeId ? app.nodeId : ''}
                                disabled={!this.state.forceEditableNodeId}
                                onChange={(e) => {
                                    const newApiData = Utils.copyObject(
                                        self.props.apiData
                                    )
                                    newApiData.appDefinition.nodeId =
                                        e.target.value
                                    self.props.updateApiData(newApiData)
                                }}
                            />
                        </Tooltip>
                    </Col>
                    <Col span={12} style={{ paddingLeft: 24 }}>
                        <Tooltip title="WARNING: Changing Node ID causes the content of your persistent directories to be deleted!">
                            <Button
                                type="default"
                                disabled={this.state.forceEditableNodeId}
                                onClick={() =>
                                    this.setState({ forceEditableNodeId: true })
                                }
                            >
                                Edit
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>

                <br />
                <br />
            </div>
        )
    }

    render() {
        const self = this
        const app = this.props.apiData!.appDefinition
        return (
            <div>
                <Row align="middle" justify="space-between">
                    <Col>
                        <h4>
                            Environmental Variables &nbsp;
                            <NewTabLink url="https://caprover.com/docs/app-configuration.html#environment-variables">
                                <InfoCircleOutlined />
                            </NewTabLink>
                        </h4>
                    </Col>
                    <Col>
                        <h5>
                            Bulk Edit&nbsp;{' '}
                            <Switch
                                onChange={(val) => {
                                    self.setState({
                                        envVarBulkEdit: val,
                                        envVarBulkVals: '',
                                    })
                                }}
                            />
                        </h5>
                    </Col>
                </Row>
                <div
                    className={
                        app.envVars && !!app.envVars.length
                            ? 'hide-on-demand'
                            : ''
                    }
                >
                    <i>
                        Currently, this app does not have any custom
                        environmental variables yet.
                    </i>
                </div>
                {this.createEnvVarSection()}
                <div
                    style={{
                        height: 36,
                    }}
                />
                <h4>
                    Port Mapping &nbsp;
                    <NewTabLink url="https://caprover.com/docs/app-configuration.html#port-mapping">
                        <InfoCircleOutlined />
                    </NewTabLink>
                </h4>
                <div
                    className={
                        app.ports && !!app.ports.length ? 'hide-on-demand' : ''
                    }
                >
                    <i>
                        Currently, this app does not have any custom port
                        mapping.
                    </i>
                </div>
                {this.createPortRows()}
                <br />
                <Button
                    block={this.props.isMobile}
                    type="default"
                    onClick={() => this.addPortMappingClicked()}
                >
                    Add Port Mapping
                </Button>
                <br />
                <br />
                <br />
                {this.createVolSection()}
                <br />
                <Row>
                    <Col
                        span={6}
                        style={{ minWidth: this.props.isMobile ? '100%' : 300 }}
                    >
                        <Tooltip title="Number of running instances of this app">
                            <Input
                                addonBefore="Instance Count"
                                type="number"
                                defaultValue={app.instanceCount + ''}
                                disabled={
                                    app.hasPersistentData &&
                                    !this.state.forceEditableInstanceCount
                                }
                                onChange={(e) => {
                                    const newApiData = Utils.copyObject(
                                        this.props.apiData
                                    )
                                    newApiData.appDefinition.instanceCount =
                                        Number(e.target.value)
                                    this.props.updateApiData(newApiData)
                                }}
                            />
                        </Tooltip>
                    </Col>
                    <Col span={6}>
                        <div
                            style={{ paddingLeft: 24 }}
                            className={
                                !app.hasPersistentData ? 'hide-on-demand' : ''
                            }
                        >
                            <Tooltip title="Multiple instances of apps with persistent data can be very dangerous and bug prone as they can be accessing the same file on the disk resulting in data corruption. Edit the instance count only if you understand the risk.">
                                <Button
                                    type="default"
                                    disabled={
                                        this.state.forceEditableInstanceCount
                                    }
                                    onClick={() =>
                                        this.setState({
                                            forceEditableInstanceCount: true,
                                        })
                                    }
                                >
                                    Edit
                                </Button>
                            </Tooltip>
                        </div>
                    </Col>
                </Row>
                <div style={{ height: 50 }} />
                <Row>
                    <Col span={24}>
                        <h4>
                            Pre-Deploy Script
                            <NewTabLink url="https://caprover.com/docs/pre-deploy-script.html">
                                <InfoCircleOutlined
                                    style={{ paddingLeft: 10 }}
                                />
                            </NewTabLink>
                        </h4>

                        <Input.TextArea
                            spellCheck={false}
                            autoCorrect="off"
                            autoComplete="off"
                            autoCapitalize="off"
                            className="code-input"
                            placeholder="var preDeployFunction = function (capRoverAppObj, dockerUpdateObject) ..."
                            rows={4}
                            value={
                                app.preDeployFunction
                                    ? app.preDeployFunction
                                    : ''
                            }
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    this.props.apiData
                                )
                                newApiData.appDefinition.preDeployFunction =
                                    e.target.value
                                this.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                </Row>
                <div style={{ height: 30 }} />
                <Row>
                    <Col span={24}>
                        <h4>
                            Service Update Override
                            <NewTabLink url="https://caprover.com/docs/service-update-override.html">
                                <InfoCircleOutlined
                                    style={{ paddingLeft: 10 }}
                                />
                            </NewTabLink>
                        </h4>

                        <Input.TextArea
                            spellCheck={false}
                            autoCorrect="off"
                            autoComplete="off"
                            autoCapitalize="off"
                            className="code-input"
                            placeholder={`## JSON / YAML
{
  "TaskTemplate": {
    "ContainerSpec": {
    "Image": "busybox",
    "Args": [
        "top"
    ]....`}
                            rows={4}
                            value={
                                app.serviceUpdateOverride
                                    ? app.serviceUpdateOverride
                                    : ''
                            }
                            onChange={(e) => {
                                const newApiData = Utils.copyObject(
                                    this.props.apiData
                                )
                                newApiData.appDefinition.serviceUpdateOverride =
                                    e.target.value
                                this.props.updateApiData(newApiData)
                            }}
                        />
                    </Col>
                </Row>

                <div style={{ height: 30 }} />
                <h4>
                    Service Tags &nbsp;
                    <NewTabLink url="https://caprover.com/docs/app-configuration.html#service-tags">
                        <InfoCircleOutlined />
                    </NewTabLink>
                </h4>
                <div style={{ marginTop: 10 }}>
                    <span
                        style={{ marginRight: 20 }}
                        onClick={() => {
                            self.setState({
                                tagsEditMode: !self.state.tagsEditMode,
                            })
                        }}
                    >
                        {self.state.tagsEditMode ? (
                            <EditFilled />
                        ) : (
                            <EditOutlined />
                        )}
                    </span>
                    <span
                        className={
                            app.tags && !!app.tags.length
                                ? 'hide-on-demand'
                                : ''
                        }
                    ></span>
                    <span>{self.createTagsValues()}</span>
                </div>
                <div
                    style={{
                        height: 36,
                    }}
                />
            </div>
        )
    }
    createTagsValues() {
        const app = this.props.apiData!.appDefinition

        if (this.state.tagsEditMode) {
            return (
                <Input.TextArea
                    className="code-input"
                    placeholder={'tag1,comma,separated,cannot-contain-space'}
                    rows={1}
                    defaultValue={(app.tags || [])
                        .map((it) => it.tagName)
                        .join(',')}
                    onChange={(e) => {
                        const newValueRaw = e.target.value

                        const newApiData = Utils.copyObject(this.props.apiData)
                        const newTags = newValueRaw
                            .split(',')
                            .map((it) => it.trim().toLocaleLowerCase())
                            .filter((it) => !!it)
                            .map((it) => {
                                return {
                                    tagName: it,
                                }
                            })
                        newApiData.appDefinition.tags = newTags
                        this.props.updateApiData(newApiData)
                    }}
                />
            )
        }

        return (
            <Fragment>
                {app.tags && app.tags.length > 0 ? (
                    app.tags.map(
                        (
                            it
                            // if non-edit mode, otherwise, display a comma separated textbox
                        ) => <Tag key={it.tagName}>{it.tagName}</Tag>
                    )
                ) : (
                    <span>
                        Currently no service tag is associated with this service
                    </span>
                )}
            </Fragment>
        )
    }

    addPortMappingClicked() {
        const newApiData = Utils.copyObject(this.props.apiData)
        newApiData.appDefinition.ports = newApiData.appDefinition.ports || []
        newApiData.appDefinition.ports.push({
            containerPort: 0,
            hostPort: 0,
        })
        this.props.updateApiData(newApiData)
    }

    addEnvVarClicked() {
        const newApiData = Utils.copyObject(this.props.apiData)
        newApiData.appDefinition.envVars =
            newApiData.appDefinition.envVars || []
        newApiData.appDefinition.envVars.push({
            key: '',
            value: '',
        })
        this.props.updateApiData(newApiData)
    }

    addVolumeClicked() {
        const newApiData = Utils.copyObject(this.props.apiData)
        newApiData.appDefinition.volumes =
            newApiData.appDefinition.volumes || []
        newApiData.appDefinition.volumes.push({
            containerPath: '',
            volumeName: '',
        })
        this.props.updateApiData(newApiData)
    }

    reFetchData() {
        this.props.reFetchData()
    }
}
