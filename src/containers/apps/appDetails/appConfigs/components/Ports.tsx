import React, { Component } from "react";
import { Col, Input, Row, Icon, Tooltip, Button } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";
import { IAppPort } from "../../../AppDefinition";

enum PortType {
  HostPort, ContainerPort
}

export default class Ports extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  onAddPortMappingClicked = () => {
    const ports = this.context.currentApp().app.ports || [];
    this.context.updateAppDefintion({ ports: [...ports, { containerPort: 0, hostPort: 0 }]});
  }

  onPortChange = (val: string, index: number, type: PortType) => {
    const ports = [...this.context.currentApp().app.ports];
    const p = Number(val.trim());
    const port = p > 0 ? p : 0; // to avoid NaN
    switch(type) {
      case PortType.HostPort:
        ports[index].hostPort = port;
        break;
      case PortType.ContainerPort:
        ports[index].containerPort = port;
        break;
    }
    this.context.updateAppDefintion({ ports });
  }

  render() {
    const { app } = this.context.currentApp();
    const { isMobile } = this.context;
    const ports = app.ports || [];

    return (
      <div>
        <h4>
          Port Mapping &nbsp;
          <a
            href="https://caprover.com/docs/app-configuration.html#port-mapping"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon type="info-circle" />
          </a>
        </h4>
        {ports.length === 0 && (
          <div>
            <i>Currently, this app does not have any custom port mapping.</i>
          </div>
        )}

        {ports.map((value: IAppPort, index: number) => (
          <Row style={{ paddingBottom: 12 }} key={`${index}`}>
            <Col span={12}>
              <Tooltip title="Make sure the port is not already used!">
                <Input
                  addonBefore="Server Port"
                  placeholder="5050"
                  value={value.hostPort ? `${value.hostPort}` : ""}
                  type="number"
                  onChange={e => this.onPortChange(e.target.value, index, PortType.HostPort)}
                />
              </Tooltip>
            </Col>
            <Col style={{ paddingLeft: 12 }} span={12}>
              <Input
                addonBefore="Container Port"
                placeholder="6060"
                value={value.containerPort ? `${value.containerPort}` : ""}
                onChange={e => this.onPortChange(e.target.value, index, PortType.ContainerPort)}
              />
            </Col>
          </Row>
        ))}
        <br />

        <Button block={isMobile} type="default" onClick={this.onAddPortMappingClicked}>
          Add Port Mapping
        </Button>
      </div>
    );
  }
}
