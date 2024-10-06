import { ClusterOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { Button, Card, Col, Collapse, Input, Radio, Row, Tooltip } from 'antd'
import { Component } from 'react'
import { localize } from '../../utils/Language'
import Utils from '../../utils/Utils'

export interface INodeToAdd {
    remoteNodeIpAddress: string
    captainIpAddress: string
    nodeType: string
    privateKey: string
    sshPort: string
    sshUser: string
}

export default class AddNode extends Component<
    {
        leaderIp: string
        isMobile: boolean
        onAddNodeClicked: (nodeToAdd: INodeToAdd) => void
    },
    {
        nodeToAdd: INodeToAdd
    }
> {
    constructor(props: any) {
        super(props)
        this.state = {
            nodeToAdd: {
                remoteNodeIpAddress: '',
                sshPort: '22',
                sshUser: 'root',
                captainIpAddress: props.leaderIp || '',
                nodeType: 'worker',
                privateKey: '',
            },
        }
    }

    changeModel(childField: string, value: string) {
        const nodeToAdd = Utils.copyObject(this.state.nodeToAdd) as any
        nodeToAdd[childField] = value
        this.setState({ nodeToAdd })
    }

    render() {
        const self = this
        const nodeToAdd = self.state.nodeToAdd

        return (
            <div>
                <Card
                    style={{ marginTop: 16 }}
                    type="inner"
                    title={localize(
                        'add_node.attach_new_node',
                        'Attach New Node'
                    )}
                >
                    <Row justify="space-between">
                        <Col lg={{ span: 11 }} xs={{ span: 24 }}>
                            <Input
                                style={{ marginBottom: 10 }}
                                addonBefore={localize(
                                    'add_node.new_node_ip_address',
                                    'New node IP Address'
                                )}
                                placeholder="123.123.123.123"
                                type="text"
                                value={nodeToAdd.remoteNodeIpAddress}
                                onChange={(e) =>
                                    self.changeModel(
                                        'remoteNodeIpAddress',
                                        e.target.value
                                    )
                                }
                            />
                        </Col>
                        <Col lg={{ span: 11 }} xs={{ span: 24 }}>
                            <Input
                                style={{ marginBottom: 10 }}
                                addonBefore={localize(
                                    'add_node.caprover_ip_address',
                                    'CapRover IP Address'
                                )}
                                placeholder="123.123.123.123"
                                type="text"
                                value={nodeToAdd.captainIpAddress}
                                onChange={(e) =>
                                    self.changeModel(
                                        'captainIpAddress',
                                        e.target.value
                                    )
                                }
                            />
                        </Col>
                        <Col span={24} style={{ marginTop: 10 }}>
                            <div style={{ paddingBottom: 5 }}>
                                &nbsp;
                                {localize(
                                    'add_node.ssh_private_key_for',
                                    'SSH Private Key for'
                                )}{' '}
                                <b>root</b>
                                &nbsp;
                                <Tooltip
                                    title={localize(
                                        'add_node.use_rsa_key',
                                        'Use RSA key. Other types such as Ed25519 are not supported, for those use the alternative method below.'
                                    )}
                                >
                                    <InfoCircleOutlined
                                        style={{
                                            paddingTop: 8,
                                            paddingLeft: 8,
                                        }}
                                    />
                                </Tooltip>
                            </div>
                            <Input.TextArea
                                style={{ marginBottom: 20 }}
                                className="code-input"
                                rows={6}
                                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIICWwIBAAKBgQDArfs81aizq8ckg16e+ewFgJg7J..."
                                value={nodeToAdd.privateKey}
                                onChange={(e) =>
                                    self.changeModel(
                                        'privateKey',
                                        e.target.value
                                    )
                                }
                            />
                        </Col>
                    </Row>
                    <Row justify="end">
                        <Radio.Group
                            defaultValue="a"
                            buttonStyle="outline"
                            style={{ marginBottom: 20 }}
                            value={nodeToAdd.nodeType}
                            onChange={(e) =>
                                self.changeModel('nodeType', e.target.value)
                            }
                        >
                            <Radio.Button value="worker">
                                {localize(
                                    'add_node.join_as_worker_node',
                                    'Join as worker node'
                                )}
                            </Radio.Button>
                            <Radio.Button value="manager">
                                {localize(
                                    'add_node.join_as_manager_node',
                                    'Join as manager node'
                                )}
                            </Radio.Button>
                        </Radio.Group>
                        &nbsp;
                        <Tooltip
                            title={localize(
                                'add_node.tip_for_node_count',
                                'Tip: For every 5 workers, add 2 manager nodes, keeping manager node count as an odd number. Therefore, use worker node for the first 4 nodes you add to your cluster.'
                            )}
                        >
                            <InfoCircleOutlined
                                style={{ paddingTop: 8, paddingLeft: 8 }}
                            />
                        </Tooltip>
                    </Row>

                    <Row justify="end">
                        <Col
                            lg={{ span: 6 }}
                            xs={{ span: 24 }}
                            style={{ maxWidth: 250 }}
                        >
                            <Input
                                addonBefore={localize(
                                    'add_node.ssh_port',
                                    'SSH Port'
                                )}
                                type="text"
                                value={nodeToAdd.sshPort}
                                onChange={(e) =>
                                    self.changeModel('sshPort', e.target.value)
                                }
                            />
                        </Col>
                        <Col
                            lg={{ span: 6 }}
                            xs={{ span: 24 }}
                            style={{ maxWidth: 250, marginLeft: 10 }}
                        >
                            <Tooltip
                                title={localize(
                                    'add_node.using_non_root_users',
                                    'Using non-root users with sudo access will NOT work. If you want to use a non-root account, it must be able run docker commands without sudo. Or simply use the alternative method below.'
                                )}
                            >
                                <Input
                                    addonBefore={localize(
                                        'add_node.ssh_user',
                                        'SSH User'
                                    )}
                                    type="text"
                                    value={nodeToAdd.sshUser}
                                    onChange={(e) =>
                                        self.changeModel(
                                            'sshUser',
                                            e.target.value
                                        )
                                    }
                                />
                            </Tooltip>
                        </Col>
                        <Button
                            style={{ marginLeft: 10 }}
                            type="primary"
                            block={this.props.isMobile}
                            onClick={() =>
                                self.props.onAddNodeClicked(
                                    self.state.nodeToAdd
                                )
                            }
                        >
                            <ClusterOutlined /> &nbsp;{' '}
                            {localize('add_node.join_cluster', 'Join Cluster')}
                        </Button>
                    </Row>
                    <div style={{ height: 50 }} />
                    <Collapse>
                        <Collapse.Panel
                            header={localize(
                                'add_node.alternative_method',
                                'Alternative Method'
                            )}
                            key="1"
                        >
                            <p>
                                {localize(
                                    'add_node.caprover_uses_ssh',
                                    'CapRover uses SSH to connect to your nodes and have them join the cluster. Sometimes, this process does not work due to non standard SSH configs such as custom ports, custom usernames, and etc.'
                                )}
                            </p>
                            <p>
                                {localize(
                                    'add_node.in_these_cases',
                                    'In these cases, it will be much simpler to run the commands manually your self from an SSH session. First, from your'
                                )}{' '}
                                <b>
                                    {localize(
                                        'add_node.main_leader_node',
                                        'main leader node'
                                    )}
                                </b>
                                ,{' '}
                                {localize(
                                    'add_node.run_the_following_command',
                                    'run the following command:'
                                )}
                            </p>
                            <code>docker swarm join-token worker</code>

                            <p style={{ marginTop: 20 }}>
                                {localize(
                                    'add_node.it_will_output_something_like_this',
                                    'It will output something like this:'
                                )}
                            </p>
                            <code>
                                To add a worker to this swarm, run the following
                                command:
                                <br />
                                docker swarm join --token
                                SWMTKN-secret-token-here 127.0.0.1:2377
                            </code>
                            <p style={{ marginTop: 20 }}>
                                {localize(
                                    'add_node.then_copy_the_command',
                                    'Then, copy the command from the output of above, and simply from the worker node, run that command.'
                                )}
                            </p>
                            <p style={{ marginTop: 20 }}>
                                {localize(
                                    'add_node.depending_on_your_network_configurations',
                                    'Depending on your network configurations, you may also need to append the command with'
                                )}{' '}
                                <code>
                                    {' '}
                                    --advertise-addr WORKER_EXTERNAL_IP:2377
                                </code>
                                .{' '}
                                <a
                                    href="https://github.com/caprover/caprover/issues/572"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {localize(
                                        'add_node.see_details_link',
                                        'See this issue for more details.'
                                    )}
                                </a>{' '}
                            </p>
                        </Collapse.Panel>
                    </Collapse>
                </Card>
            </div>
        )
    }
}
