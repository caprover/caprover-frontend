import { Alert, Icon, Row, Spin } from "antd";
import React, { Component } from "react";
import Utils from "../../../../../utils/Utils";
import { AppDetailsContext, AppLogs } from "../../AppDetailsProvider";
import ClickableLink from "../../../../global/ClickableLink";
import ScrollingLogView from "./ScrollingLogView";

interface BuildLogsViewProps {
  logs: AppLogs;
  building: boolean;
}

class BuildLogsView extends Component<
BuildLogsViewProps> {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>

  state = {
    expandedLogs: this.props.building,
    buildLogs: "",
    lastLineNumberPrinted: -10000,
  };

  componentDidUpdate(prevProps: { logs: AppLogs }) {
    if (prevProps.logs.buildLogs !== this.props.logs.buildLogs) {
      const logInfo = this.props.logs.buildLogs;

      if (this.props.building) {
        // forcefully expanding the view such that when building finishes it doesn't collapses automatically
        this.setState({ expandedLogs: true });
      }

      const lines = (logInfo && logInfo.logs.lines) || [];
      const firstLineNumberOfLogs = (logInfo && logInfo.logs.firstLineNumber) || 0;
      let firstLinesToPrint = 0;
      if (firstLineNumberOfLogs > this.state.lastLineNumberPrinted) {
        if (firstLineNumberOfLogs < 0) {
          // This is the very first fetch, probably firstLineNumberOfLogs is around -50
          firstLinesToPrint = -firstLineNumberOfLogs;
        } else {
          this.setState({
            buildLogs: this.state.buildLogs + "[[ TRUNCATED ]]\n",
          });
        }
      } else {
        firstLinesToPrint =
          this.state.lastLineNumberPrinted - firstLineNumberOfLogs;
      }

      this.setState({
        lastLineNumberPrinted: firstLineNumberOfLogs + lines.length,
      });

      let buildLogs = this.state.buildLogs;
      const ansiRegex = Utils.getAnsiColorRegex();

      for (let i = firstLinesToPrint; i < lines.length; i++) {
        const newLine = (lines[i] || "").trim().replace(ansiRegex, "");
        buildLogs += newLine + "\n";
      }

      this.setState({ buildLogs: buildLogs });
    }
  }

  onExpandLogClicked = () => {
    this.setState({ expandedLogs: !this.state.expandedLogs });
  }

  render() {
    const { expandedLogs, buildLogs: buildLogString } = this.state;
    const { building } = this.context;

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
              <ScrollingLogView
                logs={buildLogString}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

const BuildLogsViewHOC = () => (
  <AppDetailsContext.Consumer>{context => (
    <BuildLogsView logs={context.logs} building={context.building} />
  )}</AppDetailsContext.Consumer>
);

export default BuildLogsViewHOC;
