import { Icon, Row, Tooltip } from "antd";
import React, { Component } from "react";
import { AppDetailsContext } from "../../AppDetailsProvider";
import ClickableLink from "../../../../global/ClickableLink";
import ScrollingLogView from "./ScrollingLogView";

class AppLogsView extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;
  logView = React.createRef<HTMLDivElement>();
  state = {
    isWrapped: true,
    expandedLogs: true,
  };

  onExpandLogClicked = () => {
    this.setState({ expandedLogs: !this.state.expandedLogs });
  }

  render() {
    const { appLogs } = this.context.logs;
    const { isWrapped, expandedLogs } = this.state;

    return (
      <div>
        <div style={{ height: 20 }} />

        <div>
          <div>
            <Row type="flex" justify="space-between" align="middle">
              <span>
                <Row type="flex" justify="start" align="middle">
                  <span>
                    <ClickableLink
                      onLinkClicked={
                        this.onExpandLogClicked
                      }
                    >
                      <h4 className="unselectable-span">
                        <Icon
                          type={
                            !expandedLogs
                              ? "down-circle"
                              : "up-circle"
                          }
                        />
                        &nbsp;&nbsp;
                        {!expandedLogs ? "View" : "Hide"} App Logs
                      </h4>
                    </ClickableLink>
                  </span>

                  <span style={{ marginLeft: 20, paddingBottom: 3 }}>
                    <Tooltip title="View full application logs (not truncated)">
                      <a
                        href="https://caprover.com/docs/troubleshooting.html#how-to-view-my-application-s-log"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Icon type="info-circle" />
                      </a>
                    </Tooltip>
                  </span>
                </Row>
              </span>
              {expandedLogs && (
                <span>
                  <ClickableLink
                    onLinkClicked={() => {
                      this.setState({ isWrapped: !isWrapped });
                    }}
                  >
                    <h4 className="unselectable-span">
                      <Icon type="menu-fold" />
                      &nbsp;&nbsp; {isWrapped ? "Don't" : ""} wrap logs
                      &nbsp;&nbsp;
                    </h4>
                  </ClickableLink>
                </span>
              )}
            </Row>
          </div>

          {expandedLogs && (
            <div
              style={{ padding: 5 }}
            >
              <ScrollingLogView
                wrap={isWrapped}
                logs={appLogs}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default AppLogsView;
