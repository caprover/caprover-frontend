import React, { Component } from "react";
import { Button, Col, Input, Row, Switch } from "antd";
import { IHashMapGeneric } from "../../../../../models/IHashMapGeneric";
import { IAppEnvVar } from "../../../AppDefinition";
import { AppDetailsContext } from "../../AppDetailsProvider";

enum EnvType {
  Key = "key", Value = "value"
}

export default class EnvVars extends Component {
  static contextType = AppDetailsContext;
  context!: React.ContextType<typeof AppDetailsContext>;

  state = {
    envVarBulkEdit: false,
    bulkVals: "",
  };

  // Copied from https://github.com/motdotla/dotenv/blob/master/lib/main.js
  parseEnvVars(src: string) {
    const obj: IHashMapGeneric<string> = {};

    // convert Buffers before splitting into lines and processing
    src
      .toString()
      .split("\n")
      .forEach(function(line) {
        // matching "KEY' and 'VAL' in 'KEY=VAL'
        const keyValueArr = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        // matched?
        if (keyValueArr != null) {
          const key = keyValueArr[1];

          // default undefined or missing values to empty string
          let value = keyValueArr[2] || "";

          // expand newlines in quoted values
          const len = value ? value.length : 0;
          if (
            len > 0 &&
            value.charAt(0) === "\"" &&
            value.charAt(len - 1) === "\""
          ) {
            value = value.replace(/\\n/gm, "\n");
          }

          // remove any surrounding quotes and extra spaces
          value = value.replace(/(^['"]|['"]$)/g, "").trim();

          obj[key] = value;
        }
      });

    return obj;
  }

  convertEnvVarsToBulk(envVars: IAppEnvVar[]) {
    return envVars
      .map(e => {
        let val = e.value;
        if (val.indexOf("\n") >= 0) {
          val = "\"" + val.split("\n").join("\\n") + "\"";
        }
        return e.key + "=" + val;
      })
      .join("\n");
  }

  onAddClicked = () => {
    const envVars = this.context.currentApp().app.envVars || [];
    this.context.updateAppDefintion({ envVars: [...envVars, { key: "", value: "" }] });
  };

  onVarUpdated = (val: string, index: number, type: EnvType) => {
    const envVars = [...this.context.currentApp().app.envVars];
    envVars[index] = { ...envVars[index], [type]: val };
    this.context.updateAppDefintion({ envVars });
  };

  onBulkVarUpdated = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    const keyVals = this.parseEnvVars(val);
    const envVars: IAppEnvVar[] = [];
    Object.keys(keyVals).forEach(k => {
      envVars.push({ key: k, value: keyVals[k] });
    });
    this.context.updateAppDefintion({ envVars });
    this.setState({ bulkVals: val });
  };

  render() {
    const { app } = this.context.currentApp();
    const { isMobile } = this.context;

    const envVars = app.envVars || [];
    const { bulkVals, envVarBulkEdit } = this.state;

    return (
      <div>
        <h4>Environmental Variables:</h4>
        <Row align="middle" justify="end" type="flex">
          <h5>
            Bulk Edit&nbsp;{" "}
            <Switch
              onChange={val => {
                this.setState({ envVarBulkEdit: val, bulkVals: "" });
              }}
            />
          </h5>
        </Row>

        {envVars.length === 0 && (
          <div>
            <i>
              Currently, this app does not have any custom environmental variables
              yet.
            </i>
          </div>
        )}

        {envVarBulkEdit ? (
          <div>
            <Row style={{ paddingBottom: 12 }}>
              <Col span={24}>
                <Input.TextArea
                  className="code-input"
                  placeholder={"key1=value1\nkey2=value2"}
                  rows={7}
                  value={
                    bulkVals
                      ? bulkVals
                      : this.convertEnvVarsToBulk(envVars)
                  }
                  onChange={this.onBulkVarUpdated}
                />
              </Col>
            </Row>
          </div>
        ) : (
          <div>
            {envVars.map((value: IAppEnvVar, index: number) => (
              <Row style={{ paddingBottom: 12 }} key={`${index}`}>
                <Col span={8}>
                  <Input
                    className="code-input"
                    placeholder="key"
                    value={value.key}
                    type="text"
                    onChange={e => this.onVarUpdated(e.target.value, index, EnvType.Key)}
                  />
                </Col>
                <Col style={{ paddingLeft: 12 }} span={16}>
                  <Input.TextArea
                    className="code-input"
                    placeholder="value"
                    rows={1}
                    value={value.value}
                    onChange={e => this.onVarUpdated(e.target.value, index, EnvType.Value)}
                  />
                </Col>
              </Row>
            ))}

            <br />

            <Button block={isMobile} type="default" onClick={this.onAddClicked}>
              Add Key/Value Pair
            </Button>
          </div>
        )}
      </div>
    );
  }
}
