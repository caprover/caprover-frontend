import { Alert, Col, Divider, message, Row } from 'antd'
import React from 'react'
import { connect } from 'react-redux'
import Logger from '../../utils/Logger'
import Toaster from '../../utils/Toaster'
import ApiComponent from '../global/ApiComponent'
import CenteredSpinner from '../global/CenteredSpinner'
import ErrorRetry from '../global/ErrorRetry'
import AddNode, { INodeToAdd } from './AddNode'

class CurrentNodes extends ApiComponent<
    {
        defaultRegistryId: string | undefined
        isMobile: boolean
    },
    {
        isLoading: boolean
        apiData: any
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            apiData: undefined,
            isLoading: true,
        }
    }

    fetchData() {
        const self = this
        self.setState({ apiData: undefined, isLoading: true })
        self.apiManager
            .getAllNodes()
            .then(function (data) {
                self.setState({ apiData: data })
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.setState({ isLoading: false })
            })
    }

    addNode(nodeToAdd: INodeToAdd) {
        const self = this
        self.setState({ apiData: undefined, isLoading: true })
        self.apiManager
            .addDockerNode(
                nodeToAdd.nodeType,
                nodeToAdd.privateKey,
                nodeToAdd.remoteNodeIpAddress,
                nodeToAdd.sshPort,
                nodeToAdd.sshUser,
                nodeToAdd.captainIpAddress
            )
            .then(function () {
                message.success('Node added successfully!')
            })
            .catch(Toaster.createCatcher())
            .then(function () {
                self.fetchData()
            })
    }

    componentDidMount() {
        this.fetchData()
    }

    createNodes() {
        const nodes: any[] = this.state.apiData.nodes || []

        return nodes.map((node) => {
            return (
                <div
                    className="inner-card"
                    key={node.nodeId}
                    style={{
                        paddingTop: 15,
                        paddingBottom: 20,
                        paddingRight: 20,
                        paddingLeft: 20,
                        marginBottom: 40,
                        borderRadius: 5,
                    }}
                >
                    <Row justify="center">
                        <b>Node ID:&nbsp;&nbsp;</b> {node.nodeId}
                    </Row>
                    <hr />
                    <div style={{ height: 10 }} />
                    <Row>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>Type: </b>
                            {node.isLeader ? 'Leader (Main Node)' : node.type}
                        </Col>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>IP: </b>
                            {node.ip}
                        </Col>
                    </Row>
                    <Row>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>State: </b>
                            {node.state}
                        </Col>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>Status: </b>
                            {node.status}
                        </Col>
                    </Row>
                    <br />
                    <Row>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>RAM: </b>
                            {(node.memoryBytes / 1073741824).toFixed(2)} GB
                        </Col>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>OS: </b>
                            {node.operatingSystem}
                        </Col>
                    </Row>
                    <Row>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>CPU: </b>
                            {(node.nanoCpu / 1000000000).toFixed(0)} cores
                        </Col>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>Architecture: </b>
                            {node.architecture}
                        </Col>
                    </Row>
                    <br />
                    <Row>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>Hostname: </b>
                            {node.hostname}
                        </Col>
                        <Col lg={{ span: 12 }} xs={{ span: 24 }}>
                            <b>Docker Version: </b>
                            {node.dockerEngineVersion}
                        </Col>
                    </Row>
                </div>
            )
        })

        // "ip":"199.195.150.96"
        // "nodeId":"i9lccwa92dfyy9kpkktw2okll"

        // ,"type":"manager"
        // ,"isLeader":true,
        // ,"state":"ready",
        // "status":"active"

        // "hostname":"kasra-X550JK"
        // "dockerEngineVersion":"18.09.1-rc1",

        // "memoryBytes":8241434624,
        // operatingSystem":"linux",
        // "nanoCpu":8000000000,
        // ,"architecture":"x86_64","
    }

    render() {
        const self = this
        if (this.state.isLoading) {
            return <CenteredSpinner />
        }

        if (!this.state.apiData) {
            return <ErrorRetry />
        }

        const nodes: any[] = this.state.apiData.nodes || []
        let leaderIp = ''
        try {
            leaderIp = nodes.filter((n) => n.isLeader)[0].ip
        } catch (err) {
            Logger.error(err)
        }

        return (
            <div>
                {this.props.defaultRegistryId ? (
                    <AddNode
                        leaderIp={leaderIp}
                        isMobile={this.props.isMobile}
                        onAddNodeClicked={(nodeToAdd) => {
                            self.addNode(nodeToAdd)
                        }}
                    />
                ) : (
                    <div>
                        <Alert
                            type="warning"
                            showIcon={true}
                            message="Cannot add more nodes as no default push registry is set. To add more nodes and create a cluster, you first need to add a docker registry and set it as the default push registry."
                        />
                    </div>
                )}
                <div style={{ height: 50 }} />

                <Divider type="horizontal">
                    <h4>Current Cluster Nodes</h4>
                </Divider>
                <div style={{ height: 30 }} />

                <Row justify="center">
                    <Col lg={{ span: 14 }} xs={{ span: 23 }}>
                        {self.createNodes()}
                    </Col>
                </Row>
            </div>
        )
    }
}

function mapStateToProps(state: any) {
    return {
        defaultRegistryId: state.registryReducer.defaultRegistryId,
        isMobile: state.globalReducer.isMobile,
    }
}

export default connect(mapStateToProps)(CurrentNodes)
