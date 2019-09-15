import React, { Component } from "react";
import { Input, Row, Button, Modal } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";
import { IHttpAuth } from "../../../AppDefinition";

export default class HttpAuth extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>

  state = {
    dialogHttpPass: "",
    dialogHttpUser: "",
  };

  asyncSetState = async (state: any) => new Promise((resolve) => this.setState(state, resolve));

  getUserPasswordModalContent = () => {
    return (
      <div style={{ paddingTop: 30 }}>
        <p>
          HTTP Basic authentication is the simplest technique for
          enforcing access controls to web resources.
        </p>
        <p>
          You can use this technique to restrict access to HTTP apps,
          specially those you create via One-Click app generator such as
          phpMyAdmin and etc.
        </p>
        <p>
          <Input
            placeholder="username"
            type="text"
            defaultValue={this.state.dialogHttpUser}
            onChange={event =>
              this.setState({
                dialogHttpUser: (event.target.value || "").trim()
              })
            }
          />
        </p>
        <p>
          <Input
            placeholder="password"
            type="text"
            defaultValue={this.state.dialogHttpPass}
            onChange={event =>
              this.setState({
                dialogHttpPass: (event.target.value || "").trim()
              })
            }
          />
        </p>
      </div>
    )
  };

  onEditHttpAuthClicked = async () => {
    const { appDefinition: app } = this.context;
    const auth = app.httpAuth;

    const updateAuth = async () => {
      const { dialogHttpUser, dialogHttpPass } = this.state
      const { appDefinition: app } = this.context;

      let httpAuth: IHttpAuth | undefined

      if (!dialogHttpUser || !dialogHttpUser) {
        httpAuth = undefined
      } else {
        httpAuth = app.httpAuth || { user: "" }
        httpAuth.user = dialogHttpUser
        httpAuth.password = dialogHttpPass
      }

      // wait for the state to be updated
      await this.context.updateAppDefintion({ httpAuth })
      this.context.save()
    }

    await this.asyncSetState({
      dialogHttpPass: auth ? auth.password || "" : "",
      dialogHttpUser: auth ? auth.user || "" : ""
    })

    // pop the modal
    Modal.confirm({
      title: "Edit HTTP Basic Auth",
      content: this.getUserPasswordModalContent(),
      onOk() { updateAuth() }
    })
  };

  render() {
    const { appDefinition: app, isMobile } = this.context;
    const basicAuthUsername = app.httpAuth
      ? app.httpAuth.user
      : "";

    return (
      <Row>
        <Button
          style={{ marginRight: 20 }}
          type="default"
          onClick={this.onEditHttpAuthClicked}
        >
          Edit HTTP Basic Auth
        </Button>
        {isMobile && <div style={{ marginTop: 10 }} />}
        <span>
          Current State: <b>{!basicAuthUsername ? "inactive" : "active"}</b>{" "}
          {basicAuthUsername
            ? `[user: ${basicAuthUsername} @ password: <HIDDEN>]`
            : ""}
        </span>
      </Row>
    );
  }
}
