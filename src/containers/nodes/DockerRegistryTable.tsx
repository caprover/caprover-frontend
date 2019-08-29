import React, { Component } from "react";
import { Table, Icon, message, Modal, Input, Tooltip, Card } from "antd";
import {
  IRegistryApi,
  IRegistryInfo,
  IRegistryTypes
} from "../../models/IRegistryInfo";
import ClickableLink from "../global/ClickableLink";
import Utils from "../../utils/Utils";
import { ColumnProps } from "antd/lib/table";
import PasswordField from "../global/PasswordField";

const EDITING_MODAL = "EDITING_MODAL";
const DELETING_MODAL = "DELETING_MODAL";

export default class DockerRegistryTable extends Component<
  {
    apiData: IRegistryApi;
    isMobile: boolean;
    editRegistry: (dockerRegistry: IRegistryInfo) => void;
    deleteRegistry: (regId: string) => void;
  },
  {
    modalShowing: "EDITING_MODAL" | "DELETING_MODAL" | undefined;
    remoteRegistryToEdit: IRegistryInfo | undefined;
    registryIdToDelete: string | undefined;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      modalShowing: undefined,
      remoteRegistryToEdit: undefined,
      registryIdToDelete: undefined
    };
  }

  deleteRegistry(id: string) {
    if (id === this.props.apiData.defaultPushRegistryId) {
      Modal.warn({
        title: "Cannot Delete Default Push",
        content: (
          <div>
            This registry is set to be the default push. You cannot delete the
            default push registry. To remove, first you need to change the
            default push registry to another registry, or completely disable the
            default push registry. Then, come back and delete this.
          </div>
        )
      });
      return;
    }

    this.setState({
      registryIdToDelete: id,
      modalShowing: DELETING_MODAL
    });
  }

  editRegistry(dockerRegistry: IRegistryInfo) {
    if (dockerRegistry.registryType === IRegistryTypes.LOCAL_REG) {
      message.warn(
        "You cannot edit the self hosted registry. It is managed by CapRover."
      );
      return;
    }

    this.setState({
      modalShowing: EDITING_MODAL,
      remoteRegistryToEdit: Utils.copyObject(dockerRegistry)
    });
  }

  getCols(): ColumnProps<IRegistryInfo>[] {
    const columns = [
      {
        title: "User",
        dataIndex: "registryUser" as "registryUser"
      },
      {
        title: "Password",
        dataIndex: "registryPassword" as "registryPassword",
        render: (registryPassword: string) => {
          return <span>Edit to see.</span>;
        }
      },
      {
        title: "Domain",
        dataIndex: "registryDomain" as "registryDomain"
      },
      {
        title: "Image Prefix",
        dataIndex: "registryImagePrefix" as "registryImagePrefix"
      },
      {
        title: "Actions",
        dataIndex: "id" as "id",
        render: (id: string, reg: IRegistryInfo) => {
          return (
            <span>
              <ClickableLink
                onLinkClicked={() => {
                  this.editRegistry(reg);
                }}
              >
                <Icon type="form" />
              </ClickableLink>
              &nbsp;&nbsp;&nbsp;&nbsp;
              <ClickableLink
                onLinkClicked={() => {
                  this.deleteRegistry(reg.id);
                }}
              >
                <Icon type="delete" />
              </ClickableLink>
            </span>
          );
        }
      }
    ];
    return columns;
  }

  createEditModalContent() {
    return (
      <div style={{ maxWidth: 360 }}>
        <Input
          addonBefore="Username"
          placeholder="username | email@gmail.com"
          type="email"
          value={this.state.remoteRegistryToEdit!.registryUser}
          onChange={e => {
            const newData = Utils.copyObject(this.state.remoteRegistryToEdit!);
            newData.registryUser = e.target.value.trim();
            this.setState({ remoteRegistryToEdit: newData });
          }}
        />
        <div style={{ height: 20 }} />
        <PasswordField
          addonBefore="Password"
          placeholder="mypassword"
          defaultValue={this.state.remoteRegistryToEdit!.registryPassword}
          onChange={e => {
            const newData = Utils.copyObject(this.state.remoteRegistryToEdit!);
            newData.registryPassword = e.target.value;
            this.setState({ remoteRegistryToEdit: newData });
          }}
        />
        <div style={{ height: 20 }} />
        <Input
          addonBefore="Domain"
          placeholder="registry-1.docker.io"
          type="text"
          value={this.state.remoteRegistryToEdit!.registryDomain}
          onChange={e => {
            const newData = Utils.copyObject(this.state.remoteRegistryToEdit!);
            newData.registryDomain = e.target.value.trim();
            this.setState({ remoteRegistryToEdit: newData });
          }}
        />
        <div style={{ height: 20 }} />
        <Input
          addonBefore="Image Prefix"
          placeholder="username"
          addonAfter={
            <Tooltip title="Your images will be tagged as RegistryDomain/ImagePrefix/ImageName. For most providers, Image Prefix is exactly your username, unless the field DOMAIN is specific to you, in that case, this prefix is empty.">
              <Icon type="info-circle" />
            </Tooltip>
          }
          type="text"
          value={this.state.remoteRegistryToEdit!.registryImagePrefix}
          onChange={e => {
            const newData = Utils.copyObject(this.state.remoteRegistryToEdit!);
            newData.registryImagePrefix = e.target.value.trim();
            this.setState({ remoteRegistryToEdit: newData });
          }}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        <Modal
          title="Confirm Delete"
          okText="Delete Registry"
          onCancel={() => this.setState({ modalShowing: undefined })}
          onOk={() => {
            this.setState({ modalShowing: undefined });
            this.props.deleteRegistry(this.state.registryIdToDelete!);
          }}
          visible={this.state.modalShowing === DELETING_MODAL}
        >
          Are you sure you want to remote this registry from your list. You will
          no longer be able to push to or pull from this registry.
        </Modal>
        <Modal
          title="Edit Registry"
          okText="Save and Update"
          onCancel={() => this.setState({ modalShowing: undefined })}
          onOk={() => {
            this.setState({ modalShowing: undefined });
            this.props.editRegistry(
              Utils.copyObject(this.state.remoteRegistryToEdit!)
            );
          }}
          visible={this.state.modalShowing === EDITING_MODAL}
        >
          {this.state.remoteRegistryToEdit ? (
            this.createEditModalContent()
          ) : (
            <div />
          )}
        </Modal>
        <h3>Docker Registries</h3>
        <div>
          {this.props.isMobile ? 
          this.props.apiData.registries.map(registry => (
            <Card
            type="inner"
            key={registry.id}
            style={{ marginBottom: 8, wordWrap: "break-word" }}
            title={registry.registryDomain}
          >
            <div>
              <b>User:</b> {registry.registryImagePrefix}
            </div>
            <div>
              <b>Password:</b> Edit to see.
            </div>
            <div>
              <b>Domain:</b> {registry.registryDomain}
            </div>
            <div>
              <b>Image Prefix:</b> {registry.registryUser}
            </div>
            <div>
              <b>Actions:</b> 
              <span>
                <ClickableLink
                  onLinkClicked={() => {
                    this.editRegistry(registry);
                  }}
                >
                  <Icon type="form" />
                </ClickableLink>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <ClickableLink
                  onLinkClicked={() => {
                    this.deleteRegistry(registry.id);
                  }}
                >
                  <Icon type="delete" />
                </ClickableLink>
              </span>
            </div>
          </Card>
          ))
        :
        <Table
          rowKey="id"
          pagination={false}
          columns={this.getCols()}
          dataSource={this.props.apiData.registries}
        />
        }
        </div>
      </div>
    );
  }
}
