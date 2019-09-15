import { Card, Icon, Modal, Table, Tooltip } from "antd";
import { ColumnProps } from "antd/lib/table";
import moment from "moment";
import React, { Component, Fragment } from "react";
import Utils from "../../../../../utils/Utils";
import { AppDetailsContext } from "../../AppDetailsProvider";
import ClickableLink from "../../../../global/ClickableLink";
import { IAppVersion } from "../../../AppDefinition";
import Toaster from "../../../../../utils/Toaster";

export default class AppVersionTable extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  getStateRender(version: number, versionDetails: IAppVersion) {
    const { appDefinition: app } = this.context;

    if (version === app.deployedVersion) {
      return (
        <Tooltip title="Current Version">
          <Icon type="check-circle" theme="twoTone" twoToneColor="#52c41a" />
        </Tooltip>
      );
    }

    const imageName = versionDetails.deployedImageName;

    if (!imageName) {
      return (
        <Tooltip title="Failed deploy">
          <Icon type="exclamation-circle" />
        </Tooltip>
      );
    }

    return (
      <ClickableLink
        onLinkClicked={() => this.onRollbackClicked(versionDetails)}
      >
        <Tooltip title="Revert to this version">
          <span>
            <Icon type="retweet" />
          </span>
        </Tooltip>
      </ClickableLink>
    );
  }
  getCols() {

    const columns: ColumnProps<IAppVersion>[] = [
      {
        title: "State",
        key: "revertColumn", // arbitrary unique name for the column
        align: "center",
        dataIndex: "version" as "version",
        render: (version: number, versionDetails: IAppVersion) =>
          this.getStateRender(version, versionDetails),
      },
      {
        title: "Version",
        align: "center",
        dataIndex: "version" as "version",
      },
      {
        title: "Deploy Time",
        dataIndex: "timeStamp" as "timeStamp",
        render: (timeStamp: string) => {
          return (
            <Tooltip title={moment(new Date(timeStamp)).fromNow()}>
              <span>{new Date(timeStamp).toLocaleString()}</span>
            </Tooltip>
          );
        },
      },
      {
        title: "Image Name",
        dataIndex: "deployedImageName" as "deployedImageName",
      },
      {
        title: "git hash",
        dataIndex: "gitHash" as "gitHash",
        render: (gitHashOriginal: string) => {
          let gitHash = gitHashOriginal || "";
          if (gitHash.length > 12) {
            gitHash = gitHash.substr(0, 10) + "...";
          }
          return (
            <Tooltip title={gitHashOriginal}>
              <div className="code-input">{gitHash || "n/a"}</div>
            </Tooltip>
          );
        },
      },
    ];
    return columns;
  }

  onRollbackClicked(versionToRevert: IAppVersion) {
    if (!versionToRevert.deployedImageName) {
      return;
    }

    const imageName = versionToRevert.deployedImageName;
    let content = (
      <span>
        {`If you had previously deleted this image explicitly through disk cleanup,
      this revert process will fail.`}
        <br />
        <br />
        {"Do you want to continue with rolling back your app to "}
        <code>{imageName}</code>?
      </span>
    );
    if (imageName.indexOf("/") > 0) {
      content = (
        <span>
          {`${imageName} appears to be hosted on Docker Registry.
        Make sure you have not deleted this image from the repository since it was originally deployed.
        Deletion usually does not happen automatically, so if you have not deleted the image intentionally,
        you don't need to worry about this.`}
          <br />
          <br />
          {"Do you want to continue with rolling back your app to "}
          <code>{imageName}</code>?
        </span>
      );
    }
    Modal.confirm({
      title: "Rollback?",
      content,
      onOk: () => {
        this.onVersionRollbackRequested(versionToRevert);
      },
    });
  }

  onVersionRollbackRequested = async (version: IAppVersion) => {
    try {
      this.context.rollbackToVersion(version);
    } catch(err) {
      Toaster.toast(err);
    }
  }

  render() {
    const { appDefinition: app } = this.context;
    const versionsReversed = Utils.copyObject(app.versions as IAppVersion[]).reverse();
    const columns = this.getCols();
    const { isMobile } = this.context;

    return (
      <div>
        <h3>Version History</h3>
        <div>
          {isMobile ? (
            versionsReversed.map(
              (version, i) =>
                i <= 5 && (
                  <Card
                    type="inner"
                    key={i}
                    style={{ marginBottom: 8 }}
                    title={
                      <Fragment>
                        <Tooltip
                          title={moment(new Date(version.timeStamp)).fromNow()}
                        >
                          <span>
                            {new Date(version.timeStamp).toLocaleString()}
                          </span>
                        </Tooltip>
                        <div>{version.deployedImageName}</div>
                      </Fragment>
                    }
                  >
                    <div>
                      <b>Version:</b> {version.version}
                    </div>
                    <div>
                      <b>Git hash:</b> {version.gitHash || "n/a"}
                    </div>
                    <div>
                      <b>State:</b>{" "}
                      {this.getStateRender(version.version, version)}
                    </div>
                  </Card>
                )
            )
          ) : (
            <Table
              size="small"
              rowKey="timeStamp"
              pagination={{ pageSize: 5 }}
              columns={columns}
              dataSource={versionsReversed}
            />
          )}
        </div>
      </div>
    );
  }
}
