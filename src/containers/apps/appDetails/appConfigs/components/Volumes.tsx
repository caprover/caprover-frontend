import React, { Component } from "react";
import { Col, Input, Row, Icon, Tooltip, Button } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";
import { IAppVolume } from "../../../AppDefinition";

enum VolumeType {
  HostPath,
  ContainerPath,
  VolumeName,
}

export default class Volumes extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  state = {
    forceEditableNodeId: false,
  };

  onAddVolumeClicked = () => {
    const volumes = this.context.appDefinition.volumes || [];
    this.context.updateAppDefintion({ volumes: [...volumes, { containerPath: "", volumeName: "" }]});
  };

  onVolumeChange = (val: string, index: number, type: VolumeType) => {
    const volumes = [...this.context.appDefinition.volumes];
    switch(type) {
      case VolumeType.ContainerPath:
        volumes[index].containerPath = val;
        break;
      case VolumeType.HostPath:
        volumes[index].hostPath = val;
        break;
      case VolumeType.VolumeName:
        volumes[index].volumeName = val;
        break;
    }
    this.context.updateAppDefintion({ volumes });
  };

  onHostPathClicked = (index: number) => {
    const hostPath = this.context.appDefinition.volumes[index].hostPath ? "" : "/";
    this.onVolumeChange(hostPath, index, VolumeType.HostPath);
  };

  onNodeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.context.updateAppDefintion({ nodeId: e.target.value });
  };

  render() {
    const { appDefinition: app, isMobile } = this.context;
    const volumes = app.volumes || [];

    if (!app.hasPersistentData) return <div />;

    return (
      <div>
        <h4>
          Persistent Directories &nbsp;
          <a
            href="https://caprover.com/docs/app-configuration.html#persistent-or-not"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon type="info-circle" />
          </a>
        </h4>

        {volumes.length === 0 && (
          <div>
            <i>Currently, this app does not have any persistent directories.</i>
          </div>
        )}

        {volumes.map((value: IAppVolume, index: number) => (
          <Row style={{ paddingBottom: 12 }} key={"" + index}>
            <Col span={8}>
              <Input
                addonBefore="Path in App"
                className="code-input"
                placeholder="/var/www/html"
                value={value.containerPath}
                type="text"
                onChange={e => this.onVolumeChange(e.target.value, index, VolumeType.ContainerPath)}
              />
            </Col>
            <Col
              style={{ paddingLeft: 12 }}
              span={8}
              className={value.hostPath ? "hide-on-demand" : ""}
            >
              <Input
                addonBefore="Label"
                className="code-input"
                placeholder="some-name"
                value={value.volumeName}
                onChange={e => this.onVolumeChange(e.target.value, index, VolumeType.VolumeName)}
              />
            </Col>

            <Col
              style={{ paddingLeft: 12 }}
              span={8}
              className={!value.hostPath ? "hide-on-demand" : ""}
            >
              <Tooltip title="IMPORTANT: Ensure Host Path exists before assigning it here">
                <Input
                  addonBefore="Path on Host"
                  className="code-input"
                  placeholder="/host/path/exists"
                  value={value.hostPath}
                  onChange={e => this.onVolumeChange(e.target.value, index, VolumeType.HostPath)}
                />
              </Tooltip>
            </Col>
            <Col style={{ paddingLeft: 12 }} span={8}>
              <Button
                type="dashed"
                onClick={() => this.onHostPathClicked(index)}
              >
                {value.hostPath
                  ? "Let CapRover manage path"
                  : "Set specific host path"}
              </Button>
            </Col>
          </Row>
        ))}

        <br />

        <Button type="default" onClick={this.onAddVolumeClicked}>
          Add Persistent Directory
        </Button>

        <br />
        <br />
        <br />

        <Row>
          <Col span={6} style={{ width: isMobile ? '100%' : 300 }}>
            <Tooltip title="Leave empty for automatic placement">
              <Input
                addonBefore="Node ID"
                className="code-input"
                value={app.nodeId ? app.nodeId : ""}
                disabled={!this.state.forceEditableNodeId}
                onChange={this.onNodeIdChange}
              />
            </Tooltip>
          </Col>
          <Col span={12} style={{ paddingLeft: 24 }}>
            <Tooltip title="WARNING: Changing Node ID causes the content of your persistent directories to be deleted!">
              <Button
                type="default"
                disabled={this.state.forceEditableNodeId}
                onClick={() => this.setState({ forceEditableNodeId: true })}
              >
                Edit
              </Button>
            </Tooltip>
          </Col>
        </Row>

        <br />
        <br />
      </div>
    );
  }
}
