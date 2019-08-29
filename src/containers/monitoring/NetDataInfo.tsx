import { Button, Card, Col, Icon, message, Row } from "antd";
import React from "react";
import { connect } from "react-redux";
import Toaster from "../../utils/Toaster";
import Utils from "../../utils/Utils";
import ApiComponent from "../global/ApiComponent";
import CenteredSpinner from "../global/CenteredSpinner";
import ErrorRetry from "../global/ErrorRetry";
import NetDataDescription from "./NetDataDescription";
import NetDataSettingsForm from "./NetDataSettingsForm";

class NetDataInfo extends ApiComponent<
  {
    isMobile: boolean;
  },
  { apiData: any; isLoading: boolean }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      apiData: undefined,
      isLoading: true
    };
  }

  componentDidMount() {
    this.refetchData();
  }

  refetchData() {
    this.setState({ isLoading: true, apiData: undefined });
    return this.apiManager
      .getNetDataInfo()
      .then((data) => {
        this.setState({ apiData: data });
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.setState({ isLoading: false });
      });
  }

  toggleNetDataClicked(isActivated: boolean) {
    const netDataInfo = Utils.copyObject(this.state.apiData);
    netDataInfo.isEnabled = !!isActivated;
    this.onUpdateNetDataClicked(netDataInfo);
  }

  onUpdateNetDataClicked(netDataInfo: any) {
    this.setState({ isLoading: true });
    return this.apiManager
      .updateNetDataInfo(netDataInfo)
      .then(() => {
        message.success(
          netDataInfo.isEnabled
            ? "NetData is started and updated!"
            : "NetData has stopped!"
        );
      })
      .catch(Toaster.createCatcher())
      .then(() => {
        this.refetchData();
      });
  }

  render() {
    if (this.state.isLoading) {
      return <CenteredSpinner />;
    }

    if (!this.state.apiData) {
      return <ErrorRetry />;
    }

    const netDataInfo = this.state.apiData;

    return (
      <div>
        <Row type="flex" justify="center">
          <Col xs={{ span: 23 }} lg={{ span: 18 }}>
            <Card title="NetData Monitoring Tool">
              <NetDataDescription />
              <hr />
              <div style={{ height: 30 }} />
              <div className={netDataInfo.isEnabled ? "hide-on-demand" : ""}>
                <Row type="flex" justify="end">
                  <Button
                    onClick={() => this.toggleNetDataClicked(true)}
                    type="primary"
                  >
                    <span>
                      Start NetData Engine &nbsp;
                      <Icon type="poweroff" />
                    </span>
                  </Button>
                </Row>
              </div>

              <div className={!netDataInfo.isEnabled ? "hide-on-demand" : ""}>
                <Row type="flex" justify="end" gutter={20}>
                  <Button
                    style={{
                      marginRight: this.props.isMobile ? 0 : 40,
                      marginBottom: this.props.isMobile ? 8 : 0
                    }}
                    block={this.props.isMobile}
                    onClick={() => this.toggleNetDataClicked(false)}
                    type="danger"
                  >
                    <span>
                      Turn NetData Off &nbsp;
                      <Icon type="poweroff" />
                    </span>
                  </Button>
                  <a
                    type="submit"
                    href={"//" + netDataInfo.netDataUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ width: this.props.isMobile ? "100%" : "auto" }}
                  >
                    <Button
                      block={this.props.isMobile}
                      //onClick={() => this.onStartNetDataClicked()}
                      type="primary"
                    >
                      <span>
                        Open NetData &nbsp;
                        <Icon type="area-chart" />
                      </span>
                    </Button>
                  </a>
                </Row>
                <div style={{ height: 30 }} />
                <hr />
                <div style={{ height: 30 }} />
                <NetDataSettingsForm
                  updateModel={netDataInfo => {
                    this.setState({ apiData: netDataInfo });
                  }}
                  netDataInfo={netDataInfo}
                />

                <br />

                <Row type="flex" justify="end">
                  <Button
                    type="primary"
                    onClick={() =>
                      this.onUpdateNetDataClicked(
                        Utils.copyObject(this.state.apiData)
                      )
                    }
                  >
                    Update NetData
                  </Button>
                </Row>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => {
  return {
    isMobile: state.globalReducer.isMobile
  };
}

export default connect(
  mapStateToProps,
  undefined
)(NetDataInfo);
