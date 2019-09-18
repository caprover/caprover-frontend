import { Card, Icon, Popover, Tooltip, Input, Modal, Alert } from "antd";
import React, { Component } from "react";
import { AppDetailsContext } from "../AppDetailsProvider";
import ClickableLink from "../../../global/ClickableLink";
import Toaster from "../../../../utils/Toaster";

export default class DetailsCard extends Component<{
  onClose(): void;
}> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  openRenameAppDialog = () => {
    const { appName } = this.context.currentApp();
    const tempVal = { newName: appName };

    Modal.confirm({
      title: "Rename the app:",
      content: (
        <div>
          <Alert
            type="warning"
            message="If other apps use the current name to communicate with this app, make sure to update them as well to avoid problems."
          />
          <Input
            style={{ marginTop: 15 }}
            placeholder="app-name-here"
            defaultValue={appName}
            onChange={e => {
              tempVal.newName = (e.target.value || "").trim();
            }}
          />
        </div>
      ),
      onOk: () => {
        const changed = appName !== tempVal.newName;
        if (changed && tempVal.newName) { this.renameAppTo(tempVal.newName); }
      },
    });
  }

  viewDescription = () => {
    const { app } = this.context.currentApp();
    const tempVal = { tempDescription: app.description };

    Modal.confirm({
      title: "App Description:",
      content: (
        <div>
          <Input.TextArea
            style={{ marginTop: 15 }}
            placeholder="Use app description to take some notes for your app"
            rows={12}
            defaultValue={app.description}
            onChange={e => {
              tempVal.tempDescription = e.target.value;
            }}
          />
        </div>
      ),
      onOk: () => {
        const changed = app.description !== tempVal.tempDescription;
        app.description = tempVal.tempDescription;
        if (changed) {
          this.context.save();
        }
      },
    });
  }

  async renameAppTo(newName: string) {
    try {
      await this.context.renameApp(newName);
    } catch (err) {
      Toaster.toast(err);
    }
  }

  render() {
    const { app } = this.context.currentApp();

    return (
      <Card
        extra={
          <ClickableLink onLinkClicked={this.props.onClose}>
            <Tooltip title="Close">
              <Icon type="close" />
            </Tooltip>
          </ClickableLink>
        }
        title={
          <div>
            <div>
              <ClickableLink onLinkClicked={this.openRenameAppDialog}>
                <Tooltip title="Rename app" placement="bottom">
                  <Icon type="edit" />
                </Tooltip>
              </ClickableLink>
              &nbsp;&nbsp;
              {app.appName}
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              <ClickableLink onLinkClicked={this.viewDescription}>
                <Popover
                  placement="bottom"
                  content={
                    <div style={{ maxWidth: 300, whiteSpace: "pre-line" }}>
                      {app.description || "Click to edit app description..."}
                    </div>
                  }
                  title="App description"
                >
                  <Icon type="read" />
                </Popover>
              </ClickableLink>
            </div>
          </div>
        }
      >
        {this.props.children}
      </Card>
    );
  }
}
