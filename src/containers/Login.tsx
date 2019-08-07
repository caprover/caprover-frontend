import { Button, Card, Collapse, Form, Icon, Input, Radio } from "antd";
import RadioGroup from "antd/lib/radio/group";
import React from "react";
import { RouteComponentProps } from "react-router";
import ApiManager from "../api/ApiManager";
import StorageHelper from "../utils/StorageHelper";
import Toaster from "../utils/Toaster";
import ApiComponent from "./global/ApiComponent";
const FormItem = Form.Item;

const NO_SESSION = 1;
const SESSION_STORAGE = 2;
const LOCAL_STORAGE = 3;

export default class Login extends ApiComponent<RouteComponentProps<any>, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      loginOption: NO_SESSION
    };
  }

  onLoginRequested(password: string) {
    const self = this;
    this.apiManager
      .getAuthToken(password)
      .then(function() {
        if (self.state.loginOption === SESSION_STORAGE) {
          StorageHelper.setAuthKeyInSessionStorage(
            ApiManager.getAuthTokenString()
          );
        } else if (self.state.loginOption === LOCAL_STORAGE) {
          StorageHelper.setAuthKeyInLocalStorage(
            ApiManager.getAuthTokenString()
          );
        }
        self.props.history.push("/");
      })
      .catch(Toaster.createCatcher());
  }

  render() {
    const self = this;
    return (
      <div>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%)"
          }}
        >
          <Card title="CapRover Login" style={{ width: 350 }}>
            <WrappedNormalLoginForm
              onLoginRequested={(password: string, loginOption: number) => {
                self.setState({ loginOption });
                self.onLoginRequested(password);
              }}
            />
          </Card>
        </div>
      </div>
    );
  }
}

const radioStyle = {
  display: "block",
  height: "30px",
  lineHeight: "30px"
};

class NormalLoginForm extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      loginOption: NO_SESSION
    };
  }

  handleSubmit = (e: any) => {
    const self = this;
    e.preventDefault();
    this.props.form.validateFields((err: any, values: any) => {
      if (!err) {
        self.props.onLoginRequested(values.password, self.state.loginOption);
      }
    });
  };

  render() {
    const self = this;
    const { getFieldDecorator } = this.props.form;
    return (
      <Form onSubmit={this.handleSubmit} className="login-form">
        <FormItem>
          {getFieldDecorator("password", {
            rules: [{ required: true, message: "Please input your Password!" }]
          })(
            <Input.Password
              prefix={<Icon type="lock" style={{ color: "rgba(0,0,0,.25)" }} />}
              placeholder="Password"
            />
          )}
        </FormItem>
        <FormItem>
          <Button
            style={{ float: "right" }}
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            Login
          </Button>
        </FormItem>
        <FormItem>
          <Collapse>
            <Collapse.Panel header="Remember Me" key="1">
              <RadioGroup
                onChange={e => {
                  self.setState({ loginOption: e.target.value });
                }}
                value={this.state.loginOption}
              >
                <Radio style={radioStyle} value={NO_SESSION}>
                  No session persistence (Most Secure)
                </Radio>
                <Radio style={radioStyle} value={SESSION_STORAGE}>
                  Use sessionStorage
                </Radio>
                <Radio style={radioStyle} value={LOCAL_STORAGE}>
                  Use localStorage (Most Persistent)
                </Radio>
              </RadioGroup>
            </Collapse.Panel>
          </Collapse>
        </FormItem>
      </Form>
    );
  }
}

const WrappedNormalLoginForm = Form.create<any>()(NormalLoginForm);
