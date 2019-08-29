import { Alert, Icon, Modal, Select } from "antd";
import React, { Component } from "react";
import { IRegistryApi } from "../../models/IRegistryInfo";
import Utils from "../../utils/Utils";
import ClickableLink from "../global/ClickableLink";

const Option = Select.Option;
const NONE = "none";
const DISABLED_PUSH = "disabled push";

export default class DefaultDockerRegistry extends Component<
  {
    apiData: IRegistryApi;
    changeDefault: (regId: string) => void;
  },
  { isInEditMode: boolean; newSelectedDefaultId: string }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      isInEditMode: false,
      newSelectedDefaultId: ""
    };
  }

  getDefaultRegText() {
    const registries = this.props.apiData.registries;
    const defaultPushRegistryId = this.props.apiData.defaultPushRegistryId;
    for (let index = 0; index < registries.length; index++) {
      const element = registries[index];
      if (element.id === defaultPushRegistryId) {
        return element.registryUser + " @ " + element.registryDomain;
      }
    }

    return DISABLED_PUSH;
  }

  getAllOptions() {
    const registries = Utils.copyObject(this.props.apiData.registries);
    return registries.map((element) => {
      return (
        <Option value={element.id} key={element.id}>
          {element.registryUser + " @ " + element.registryDomain}
        </Option>
      );
    });
  }

  render() {
    return (
      <div>
        <Modal
          title="Edit Push Registry"
          okText="Save and Update"
          onCancel={() => this.setState({ isInEditMode: false })}
          onOk={() => {
            this.setState({ isInEditMode: false });
            this.props.changeDefault(this.state.newSelectedDefaultId);
          }}
          visible={this.state.isInEditMode}
        >
          <p>
            Default Docker Registry is the registry that will be used to store
            your newly built images. You can select <code>{DISABLED_PUSH}</code>{" "}
            if you don't want to push your newly built images to any docker
            registry. Keep in mind that if you use <code>{DISABLED_PUSH}</code>,
            cluster nodes (if you happen to have more than one server) will not
            be able to run your applications.
          </p>
          <p>Change the default Docker Registry:</p>
          <Select
            defaultValue={this.props.apiData.defaultPushRegistryId || NONE}
            style={{ width: 300 }}
            onChange={(value: string) => {
              if (value === NONE) {
                this.setState({ newSelectedDefaultId: "" });
              } else {
                this.setState({ newSelectedDefaultId: value });
              }
            }}
          >
            <Option value={NONE}>{DISABLED_PUSH}</Option>
            {this.getAllOptions()}
          </Select>

          <div
            style={{ marginTop: 20 }}
            className={
              !!this.state.newSelectedDefaultId ? "hide-on-demand" : ""
            }
          >
            <Alert
              showIcon={true}
              type="warning"
              message="If you have a cluster (more than one server), you need to have a default push registry. If you only have one single server, disabling default push registry is fine."
            />
          </div>
        </Modal>
        <h3>Default Push Registry</h3>
        <p>
          Docker Registry for Pushing New Images:{" "}
          <ClickableLink
            onLinkClicked={() => {
              this.setState({
                isInEditMode: true,
                newSelectedDefaultId:
                  this.props.apiData.defaultPushRegistryId || ""
              });
            }}
          >
            <code>{this.getDefaultRegText()}</code> <Icon type="edit" />
          </ClickableLink>
        </p>
      </div>
    );
  }
}
