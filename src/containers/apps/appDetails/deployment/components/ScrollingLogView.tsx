import React, { Component } from "react";

class ScrollingLogView extends Component<
{
  logs?: string;
  wrap?: boolean;
}
> {
  state = {
    initialLogScroll: false,
  }

  logView = React.createRef<HTMLDivElement>();

  componentDidMount() {
    // if we mounted with logs, scroll us to the bottom of them
    if (this.props.logs) {
      this.scrollLogs();
    }
  }

  getSnapshotBeforeUpdate(prevProps: { logs?: string }) {
    // if the logs changed
    if (prevProps.logs !== this.props.logs) {
      const textarea = this.logView.current;
      if (!textarea) { return; }

      // grab our old scroll position
      return Math.abs(textarea.scrollTop -
        (textarea.scrollHeight - textarea.offsetHeight));
    }

    return null;
  }

  componentDidUpdate(prevProps: { logs?: string }, _prevState: {}, scrollPos?: number) {
    // if the logs changed
    if (prevProps.logs !== this.props.logs) {
      const textarea = this.logView.current;
      if (!textarea) { return; }

      // always scroll if this is our first time seeing logs
      const firstLogs = !this.state.initialLogScroll && this.props.logs;

      // Almost at the bottom. So keep the scroll at the bottom. Otherwise, user, may have manually scrolled up. Respect the user!
      if (firstLogs || (scrollPos && scrollPos < 100)) {
        this.scrollLogs();
      }
    }
  }

  scrollLogs() {
    const textarea = this.logView.current;
    if (textarea) {
      textarea.scrollTop = textarea.scrollHeight;
      this.setState({ initialLogScroll: true });
    }
  }

  render() {
    const { logs, wrap } = this.props;

    return (
      <div
        ref={this.logView}
        className="logs-output"
        style={{
          whiteSpace: wrap ? "pre-line" : "pre",
        }}
      >
        {logs}
      </div>
    );
  }
}

export default ScrollingLogView;
