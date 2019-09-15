import React, { Component } from "react";
import { Col, Input, Row, Tooltip, Button } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";

export default class Instances extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  state = {
    forceEditableInstanceCount: false,
  };

  onInstanceCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const instanceCount = Number(e.target.value);
    this.context.updateAppDefintion({ instanceCount });
  };

  render() {
    const { app } = this.context.currentApp();
    const { isMobile } = this.context;

    return (
      <Row>
        <Col span={6} style={{ width: isMobile ? "100%" : 300 }}>
          <Tooltip title="Number of running instances of this app">
            <Input
              addonBefore="Instance Count"
              type="number"
              defaultValue={`${app.instanceCount}`}
              disabled={
                app.hasPersistentData &&
                !this.state.forceEditableInstanceCount
              }
              onChange={this.onInstanceCountChange}
            />
          </Tooltip>
        </Col>
        <Col span={6}>
          {app.hasPersistentData && (
            <div
              style={{ paddingLeft: 24 }}
            >
              <Tooltip title="Multiple instances of apps with persistent data can be very dangerous and bug prone as they can be accessing the same file on the disk resulting in data corruption. Edit the instance count only if you understand the risk.">
                <Button
                  type="default"
                  disabled={this.state.forceEditableInstanceCount}
                  onClick={() =>
                    this.setState({ forceEditableInstanceCount: true })
                  }
                >
                  Edit
                </Button>
              </Tooltip>
            </div>
          )}
        </Col>
      </Row>
    );
  }
}
