import React, { Component } from "react";
import { Row, Col, Card } from "antd";
import DockerRegistries from "./DockerRegistries";
import Nodes from "./Nodes";

export default class Cluster extends Component {
  render() {
    return (
      <div>
        <Row type="flex" justify="center">
          <Col lg={{ span: 20 }} xs={{ span: 23}}>
            <Card title="Docker Registry Configuration">
              <DockerRegistries />
            </Card>
          </Col>
        </Row>
        <div style={{ height: 35 }} />
        <Row type="flex" justify="center">
          <Col lg={{ span: 20 }} xs={{ span: 23}}>
            <Card title="Nodes">
              <Nodes />
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
  componentDidMount() {}
}
