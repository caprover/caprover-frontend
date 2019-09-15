import { Alert, Icon, Row, Spin } from "antd";
import React, { Component } from "react";
import Utils from "../../../../../utils/Utils";
import { AppDetailsContext } from "../../AppDetailsProvider";
import ClickableLink from "../../../../global/ClickableLink";

export default class BuildLogsView extends Component<
  {
    buildLogRecreationId: string;
  },
  {
    expandedLogs: boolean;
    buildLogs: string;
    lastLineNumberPrinted: number;
  }
> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>

  constructor(props: any) {
    super(props);
    this.state = {
      expandedLogs: !!this.props.buildLogRecreationId,
      buildLogs: "",
      lastLineNumberPrinted: -10000
    };
  }

  componentWillReceiveProps(next: any, nextContext: any) {
    if (nextContext.logs.buildLogs !== this.context!.logs.buildLogs) {
      const logInfo = nextContext.logs.buildLogs;

      if (nextContext.building) {
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
        setTimeout(function() {
          let textarea = document.getElementById("buildlog-text-id");
          if (textarea) textarea.scrollTop = textarea.scrollHeight;
        }, 100);
      }
    }
  }

  onExpandLogClicked = () => {
    this.setState({ expandedLogs: !this.state.expandedLogs });
  }

  render() {
    const { expandedLogs, buildLogs: buildLogString } = this.state;
    const { building } = this.context!;

    return (
      <div>
        <Row>
          {building && (
            <div>
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
          )}
        </Row>

        <div style={{ height: 20 }} />

        <div>
          <div>
            <ClickableLink
              onLinkClicked={
                this.onExpandLogClicked
              }
            >
              <h4 className="unselectable-span">
                <Icon
                  type={!expandedLogs ? "down-circle" : "up-circle"}
                />
                &nbsp;&nbsp;
                {!this.state.expandedLogs ? "View" : "Hide"} Build Logs
              </h4>
            </ClickableLink>
          </div>

          {(building || expandedLogs) && (
            <div
              style={{ padding: 5 }}
            >
              <div
                id="buildlog-text-id"
                className="logs-output"
                style={{
                  whiteSpace: "pre"
                }}
              >
                {buildLogString}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}
