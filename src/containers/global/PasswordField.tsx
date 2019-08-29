import { Button, Input } from "antd";
import React, { Component, Fragment } from "react";

export default class PasswordField extends Component<
  {
    placeholder?: string;
    addonBefore?: string;
    defaultValue: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  },
  any
> {
  constructor(props: any) {
    super(props);
    this.state = {
      isShowing: !props.defaultValue
    };
  }

  render() {
    return (
      <Fragment>
        {this.state.isShowing ? this.createInput() : this.createButton()}
      </Fragment>
    );
  }

  createButton() {
    return (
      <Button
        style={{ width: "100%" }}
        onClick={() => {
          this.setState({ isShowing: true });
        }}
      >
        Show Password
      </Button>
    );
  }

  createInput() {
    return (
      <Input
        type="text"
        spellCheck={false}
        autoCorrect="off"
        autoComplete="off"
        autoCapitalize="off"
        placeholder={this.props.placeholder}
        addonBefore={this.props.addonBefore}
        defaultValue={this.props.defaultValue}
        onChange={e => this.props.onChange(e)}
      />
    );
  }
}
