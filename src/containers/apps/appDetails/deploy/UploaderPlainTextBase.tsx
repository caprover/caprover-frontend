import { Button, Input, Row } from "antd";
import React from "react";
import Toaster from "../../../../utils/Toaster";
import ApiComponent from "../../../global/ApiComponent";

export default abstract class UploaderPlainTextBase extends ApiComponent<
  {
    appName: string;
    onUploadSucceeded: () => void;
  },
  {
    userEnteredValue: string;
    uploadInProcess: boolean;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      userEnteredValue: "",
      uploadInProcess: false
    };
  }

  protected abstract getPlaceHolderValue(): string;

  protected abstract convertDataToCaptainDefinition(
    userEnteredValue: string
  ): string;

  startDeploy(captainDefinitionToBeUploaded: string) {
    Promise.resolve() //
      .then(() => {
        this.setState({ uploadInProcess: true });
        return this.apiManager.uploadCaptainDefinitionContent(
          this.props.appName,
          JSON.parse(captainDefinitionToBeUploaded),
          "",
          true
        );
      })
      .then(() => {
        this.setState({ userEnteredValue: "" });
        this.props.onUploadSucceeded();
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.setState({ uploadInProcess: false });
      });
  }

  render() {
    return (
      <div style={{ padding: 16 }}>
        <Row>
          <Input.TextArea
            className="code-input"
            placeholder={this.getPlaceHolderValue()}
            rows={7}
            value={this.state.userEnteredValue}
            onChange={e => {
              this.setState({
                userEnteredValue: e.target.value
              });
            }}
          />
        </Row>
        <div style={{ height: 20 }} />
        <Row type="flex" justify="end">
          <Button
            disabled={
              this.state.uploadInProcess || !this.state.userEnteredValue.trim()
            }
            type="primary"
            onClick={() =>
              this.startDeploy(
                this.convertDataToCaptainDefinition(this.state.userEnteredValue)
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
