import React, { Component, ContextType, ChangeEvent } from "react";
import { Input, Button } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";

export default class Nginx extends Component {
  static contextType = AppDetailsContext;
  context!: ContextType<typeof AppDetailsContext>;

  onEditDefaultNginxConfigClicked = () => {
    const { defaultNginxConfig } = this.context;
    this.context.updateAppDefintion({ customNginxConfig: defaultNginxConfig });
  };

  onConfigChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    this.context.updateAppDefintion({ customNginxConfig: e.target.value });
  };

  render() {
    const { appDefinition: app } = this.context;
    const customNginxConfig = app.customNginxConfig!;

    if (!customNginxConfig) {
      return (
        <div>
          <Button
            type="default"
            onClick={this.onEditDefaultNginxConfigClicked}
          >
            Edit Default Nginx Configurations
          </Button>
        </div>
      );
    }

    return (
      <div>
        <p>
          Templates are built using EJS template pattern. Do not change the
          areas between <code>&lt;%</code> and <code>%&gt;</code> , unless you
          really know what you're doing! To revert to default, simply remove all
          the content.
        </p>
        <Input.TextArea
          style={{
            fontFamily: "monospace"
          }}
          onChange={this.onConfigChange}
          rows={17}
          defaultValue={customNginxConfig}
        />
      </div>
    );
  }
}
