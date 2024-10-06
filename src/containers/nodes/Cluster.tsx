import { Card, Col, Row } from 'antd'
import { Component } from 'react'
import { localize } from '../../utils/Language'
import DockerRegistries from './DockerRegistries'
import Nodes from './Nodes'

export default class Cluster extends Component {
    render() {
        return (
            <div>
                <Row justify="center">
                    <Col lg={{ span: 20 }} xs={{ span: 23 }}>
                        <Card
                            title={localize(
                                'cluster.docker_registry_title',
                                'Docker Registry Configuration'
                            )}
                        >
                            <DockerRegistries />
                        </Card>
                    </Col>
                </Row>
                <div style={{ height: 35 }} />
                <Row justify="center">
                    <Col lg={{ span: 20 }} xs={{ span: 23 }}>
                        <Card
                            title={localize(
                                'cluster.nodes_section_title',
                                'Nodes'
                            )}
                        >
                            <Nodes />
                        </Card>
                    </Col>
                </Row>
            </div>
        )
    }
    componentDidMount() {}
}
