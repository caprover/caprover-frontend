import { Alert, Icon, Row, Spin } from "antd";
import React from "react";
import Toaster from "../../../../utils/Toaster";
import Utils from "../../../../utils/Utils";
import ApiComponent from "../../../global/ApiComponent";
import ClickableLink from "../../../global/ClickableLink";

export default class BuildLogsView extends ApiComponent<
  {
    appName: string;
    onAppBuildFinished: () => void;
    buildLogRecreationId: string;
  },
  {
    isAppBuilding: boolean;
    expandedLogs: boolean;
    buildLogs: string;
    lastLineNumberPrinted: number;
  }
> {
  private fetchBuildLogsInterval: any;
  constructor(props: any) {
    super(props);
    this.state = {
      isAppBuilding: false,
      expandedLogs: !!this.props.buildLogRecreationId,
      buildLogs: "",
      lastLineNumberPrinted: -10000
    };
  }

  componentWillUnmount() {
    if (super.componentWillUnmount) super.componentWillUnmount();
    if (this.fetchBuildLogsInterval) {
      clearInterval(this.fetchBuildLogsInterval);
    }
  }

  fetchBuildLogs() {
    this.apiManager
      .fetchBuildLogs(this.props.appName)
      .then((logInfo: {
        isAppBuilding: boolean;
        isBuildFailed: boolean;
        logs: {
          firstLineNumber: number;
          lines: string[];
        };
      }) => {
        if (this.state.isAppBuilding && !logInfo.isAppBuilding) {
          // App was building but not anymore
          this.props.onAppBuildFinished();
        }

        this.setState({ isAppBuilding: logInfo.isAppBuilding });
        if (logInfo.isAppBuilding) {
          // forcefully expanding the view such that when building finishes it doesn't collapses automatically
          this.setState({ expandedLogs: true });
        }

        let lines = logInfo.logs.lines;
        let firstLineNumberOfLogs = logInfo.logs.firstLineNumber;
        let firstLinesToPrint = 0;
        if (firstLineNumberOfLogs > this.state.lastLineNumberPrinted) {
          if (firstLineNumberOfLogs < 0) {
            // This is the very first fetch, probably firstLineNumberOfLogs is around -50
            firstLinesToPrint = -firstLineNumberOfLogs;
          } else {
            this.setState({
              buildLogs: this.state.buildLogs + "[[ TRUNCATED ]]\n"
            });
          }
        } else {
          firstLinesToPrint =
            this.state.lastLineNumberPrinted - firstLineNumberOfLogs;
        }

        this.setState({
          lastLineNumberPrinted: firstLineNumberOfLogs + lines.length
        });

        let lineAdded = false;

        let buildLogs = this.state.buildLogs;
        const ansiRegex = Utils.getAnsiColorRegex();
        for (let i = firstLinesToPrint; i < lines.length; i++) {
          const newLine = (lines[i] || "").trim().replace(ansiRegex, "");
          buildLogs += newLine + "\n";

          lineAdded = true;
        }
        this.setState({ buildLogs: buildLogs });

        if (lineAdded) {
          setTimeout(() => {
            let textarea = document.getElementById("buildlog-text-id");
            if (textarea) textarea.scrollTop = textarea.scrollHeight;
          }, 100);
        }
      })
      .catch(Toaster.createCatcher());
  }

  componentDidMount() {
    this.fetchBuildLogs();
    this.fetchBuildLogsInterval = setInterval(() => {
      this.fetchBuildLogs();
    }, 2000);
  }

  onExpandLogClicked() {
    this.setState({ expandedLogs: !this.state.expandedLogs });
  }

  render() {
    return (
      <div>
        <Row>
          <div className={this.state.isAppBuilding ? "" : "hide-on-demand"}>
            <Alert
              message={
                <span>
                  &nbsp;&nbsp;
                  <Spin
                    indicator={
                      <Icon type="loading" style={{ fontSize: 24 }} spin />
                    }
                    size="default"
                  />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Building the image. This
                  might take a few minutes...
                </span>
              }
              type="info"
            />
          </div>
        </Row>

        <div style={{ height: 20 }} />

        <div>
          <div>
            <ClickableLink
              onLinkClicked={() => {
                this.onExpandLogClicked();
              }}
            >
              <h4 className="unselectable-span">
                <Icon
                  type={!this.state.expandedLogs ? "down-circle" : "up-circle"}
                />
                &nbsp;&nbsp;
                {!this.state.expandedLogs ? "View" : "Hide"} Build Logs
              </h4>
            </ClickableLink>
          </div>

          <div
            className={
              this.state.isAppBuilding || this.state.expandedLogs
                ? ""
                : "hide-on-demand"
            }
            style={{ padding: 5 }}
          >
            <div
              id="buildlog-text-id"
              className="logs-output"
              style={{
                whiteSpace: "pre"
              }}
            >
              {this.state.buildLogs}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
