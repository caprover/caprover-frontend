import React, { Component } from "react";
import { Modal } from "antd";

export default class ReloadCaptainModal extends Component<
  {
    isRefreshTimerActivated: boolean;
  },
  { timeToRefresh: number }
> {
  private hasAlreadyActivated: boolean;
  constructor(props: any) {
    super(props);
    this.hasAlreadyActivated = false;
    this.state = {
      timeToRefresh: 0
    };
  }

  startTimer() {
    this.setState({ timeToRefresh: 30 });
    setInterval(() => {
      if (this.state.timeToRefresh < 2) {
        window.location.reload(true);
        return;
      }
      this.setState({ timeToRefresh: this.state.timeToRefresh - 1 });
    }, 1000);
  }

  render() {
    if (this.props.isRefreshTimerActivated && !this.hasAlreadyActivated) {
      this.hasAlreadyActivated = true;
      setTimeout(() => this.startTimer(), 10);
    }

    return (
      <div>
        <Modal
          closable={false}
          footer={<div />}
          title="Update Process Started"
          visible={this.state.timeToRefresh > 0}
        >
          <div>
            {this.props.children}
            <p>
              <b>Time to Refresh: </b>
              {this.state.timeToRefresh}
            </p>
          </div>
        </Modal>
      </div>
    );
  }
}
