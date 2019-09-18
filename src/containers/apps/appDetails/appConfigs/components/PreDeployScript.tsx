import React, { Component } from "react";
import { Input, Row, Icon } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";

export default class PreDeployScript extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  onScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const preDeployFunction = e.target.value;
    this.context.updateAppDefintion({ preDeployFunction });
  };

  render() {
    const { app } = this.context.currentApp();

    return (
      <Row>
        <h4>
          Pre-Deploy Script
          <a
            style={{ paddingLeft: 10 }}
            href="https://caprover.com/docs/pre-deploy-script.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon type="info-circle" />
          </a>
        </h4>

        <Input.TextArea
          spellCheck={false}
          autoCorrect="off"
          autoComplete="off"
          autoCapitalize="off"
          className="code-input"
          placeholder="var preDeployFunction = function (capRoverAppObj, dockerUpdateObject) ..."
          rows={4}
          value={app.preDeployFunction ? app.preDeployFunction : ""}
          onChange={this.onScriptChange}
        />
      </Row>
    );
  }
}
