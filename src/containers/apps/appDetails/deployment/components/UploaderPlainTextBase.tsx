import { Button, Input, Row } from "antd";
import React, { Component } from "react";
import Toaster from "../../../../../utils/Toaster";
import { AppDetailsContext } from "../../AppDetailsProvider";

export default abstract class UploaderPlainTextBase extends Component<
  {
  },
  {
    userEnteredValue: string;
    uploadInProcess: boolean;
  }
> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>

  state = {
    userEnteredValue: "",
    uploadInProcess: false,
  };

  protected abstract getPlaceHolderValue(): string;

  protected abstract convertDataToCaptainDefinition(
    userEnteredValue: string
  ): string;

  async startDeploy(captainDefinitionToBeUploaded: string) {
    this.setState({ uploadInProcess: true });
    try {
      await this.context.uploadCaptainDefinitionContent(captainDefinitionToBeUploaded);
      this.setState({ userEnteredValue: "" });
    } catch (err) {
      Toaster.toast(err)
    }

    this.setState({ uploadInProcess: false });
  }

  render() {
    const self = this;
    return (
      <div style={{ padding: 16 }}>
        <Row>
          <Input.TextArea
            className="code-input"
            placeholder={self.getPlaceHolderValue()}
            rows={7}
            value={self.state.userEnteredValue}
            onChange={e => {
              self.setState({
                userEnteredValue: e.target.value
              });
            }}
          />
        </Row>
        <div style={{ height: 20 }} />
        <Row type="flex" justify="end">
          <Button
            disabled={
              self.state.uploadInProcess || !self.state.userEnteredValue.trim()
            }
            type="primary"
            onClick={() =>
              self.startDeploy(
                self.convertDataToCaptainDefinition(self.state.userEnteredValue)
              )
            }
          >
            Deploy Now
          </Button>
        </Row>
      </div>
    );
  }
}
