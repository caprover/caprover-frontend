import {
  Button,
  Checkbox,
  Col,
  Icon,
  Input,
  message,
  Modal,
  Row,
} from "antd";
import React, { Component } from "react";
import { AppDetailsContext } from "../AppDetailsProvider";
import Toaster from "../../../../utils/Toaster";
import { IAppVolume, IAppDef } from "../../AppDefinition";
import { IHashMapGeneric } from "../../../../models/IHashMapGeneric";

interface ActionBarState {
  confirmedAppNameToDelete: string;
  volumesToDelete: IHashMapGeneric<boolean>;
}

export default class ActionBar extends Component<{
  onClose(): void;
}, ActionBarState> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  state = {
    confirmedAppNameToDelete: "",
    volumesToDelete: {} as IHashMapGeneric<boolean>,
  }

  asyncSetState = async (state: Partial<ActionBarState>) => new Promise((resolve) => this.setState(state as ActionBarState, resolve))

  getDeleteModalContent = (app: IAppDef, volumes: string[]) => {
    return (
      <div>
        <p>
          You are about to delete <code>{app.appName}</code>. Enter the
          name of this app in the box below to confirm deletion of this app.
          Please note that this is
          <b> not reversible</b>.
        </p>
        {volumes.length > 0 && (
          <p>
            Please select the volumes you want to delete. Note that if any of
            the volumes are being used by other CapRover apps, they will not be
            deleted even if you select them. <b>Note: </b>deleting volumes takes
            more than 10 seconds, please be patient
          </p>
        )}
        {volumes.map(v => {
          return (
            <div key={v}>
              <Checkbox
                defaultChecked={!!this.state.volumesToDelete[v]}
                onChange={() => {
                  this.setState({ volumesToDelete: { ...this.state.volumesToDelete, [v]: !this.state.volumesToDelete[v] } });
                }}
              >
                {v}
              </Checkbox>
            </div>
          );
        })}
        <br />
        <br />

        <p>Confirm App Name:</p>
        <Input
          type="text"
          placeholder={app.appName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            this.setState({ confirmedAppNameToDelete: e.target.value.trim() });
          }}
        />
      </div>
    );
  }

  onDeleteConfirm = async () => {
    const { appName } = this.context.currentApp();

    if (this.state.confirmedAppNameToDelete !== appName) {
      message.warning("App name did not match. Operation cancelled.");
      return;
    }

    const volumes: string[] = [];
    Object.keys(this.state.volumesToDelete).forEach(v => {
      if (this.state.volumesToDelete[v]) {
        volumes.push(v);
      }
    });

    try {
      const response = await this.context.deleteApp(appName, volumes);
      const volumesFailedToDelete = response && response.data ? response.data.volumesFailedToDelete : null;

      if (volumesFailedToDelete && volumesFailedToDelete.length) {
        Modal.info({
          title: "Some volumes weren't deleted!",
          content: (
            <div>
              <p>
                Some volumes weren&apos;t deleted because they were probably
                being used by other containers. Sometimes, this is because
                of a temporary delay when the original container deletion
                was done with a delay. Please see{" "}
                <a
                  href="https://caprover.com/docs/app-configuration.html#removing-persistent-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  documentations
                </a>{" "}
                and delete them manually if needed. Skipped volumes are:
              </p>
              <ul>
                {volumesFailedToDelete.map((v, idx) => (
                  <li key={idx}>
                    <code>{v}</code>
                  </li>
                ))}
              </ul>
            </div>
          ),
        });
      }
      message.success("App deleted!");
      this.props.onClose();
    } catch(err) {
      Toaster.toast(err);
    }
  }

  onDeleteAppClicked = async () => {
    const { app } = this.context.currentApp();
    const allVolumes: string[] = [];
    const volumesToDelete: IHashMapGeneric<boolean> = {};

    if (app.volumes) {
      app.volumes.forEach((v: IAppVolume) => {
        if (v.volumeName) {
          allVolumes.push(v.volumeName);
          volumesToDelete[v.volumeName] = true;
        }
      });
    }

    await this.asyncSetState({ volumesToDelete, confirmedAppNameToDelete: "" });

    Modal.confirm({
      title: "Confirm Permanent Delete?",
      content: this.getDeleteModalContent(app, allVolumes),
      onOk: this.onDeleteConfirm,
    });
  }

  render() {
    const { isMobile } = this.context;

    return (
      <Row type="flex" justify="center" gutter={20}>
        <Col span={8}>
          <div style={{ textAlign: "center" }}>
            <Button
              style={{ minWidth: isMobile ? 35 : 135 }}
              type="danger"
              size="large"
              onClick={this.onDeleteAppClicked}
            >
              {isMobile ? (
                <Icon type="delete" />
              ) : (
                "Delete App"
              )}
            </Button>
          </div>
        </Col>
        <Col span={8}>
          <div style={{ textAlign: "center" }}>
            <Button
              style={{ minWidth: isMobile ? 35 : 135 }}
              type="primary"
              size="large"
              onClick={() => this.context.save()}
            >
              {isMobile ? (
                <Icon type="save" />
              ) : (
                "Save & Update"
              )}
            </Button>
          </div>
        </Col>
      </Row>
    );
  }
}
