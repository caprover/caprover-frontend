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
  render() {
    const self = this;
    return (
      <Input.Password
        spellCheck={false}
        autoCorrect="off"
        autoComplete="off"
        autoCapitalize="off"
        placeholder={self.props.placeholder}
        addonBefore={self.props.addonBefore}
        defaultValue={self.props.defaultValue}
        onChange={e => self.props.onChange(e)}
      />
    );
  }
}
