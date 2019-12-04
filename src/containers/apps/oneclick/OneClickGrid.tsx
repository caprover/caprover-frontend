import { Input, Empty, Card, Icon } from "antd";
import React, { Component, Fragment } from "react";
import { IOneClickAppIdentifier } from "../../../models/IOneClickAppModels";
import NewTabLink from "../../global/NewTabLink";

export default class OneClickGrid extends Component<
  {
    oneClickAppList: IOneClickAppIdentifier[];
    onAppSelectionChanged: (appName: string) => void;
  },
  { searchTerm: string; selectedApp: string | undefined }
> {
  constructor(props: any) {
    super(props);
    this.state = {
      selectedApp: undefined,
      searchTerm: ""
    };
  }

  createOneClickApp(app: IOneClickAppIdentifier) {
    return (
      <div key={app.name} className="one-click-app-card">
        <Card
          onClick={() => this.props.onAppSelectionChanged(app.name)}
          cover={
            <img style={{ margin: 10 }} src={app.logoUrl} alt="App logo" />
          }
          hoverable
        >
          <Card.Meta title={app.displayName} description={app.description} />
        </Card>
      </div>
    );
  }

  render() {
    const self = this;
    const apps = self.props.oneClickAppList.filter(it => {
      const str = (this.state.searchTerm || "").trim();
      // Use npm i string-similarity --save
      return !str || it.name.toLowerCase().indexOf(str.toLowerCase()) >= 0;
    });
    return (
      <Fragment>
        <div style={{ height: 40 }} />
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center"
          }}
        >
          <Input.Search
            style={{ maxWidth: 200, marginBottom: 30 }}
            placeholder="Search for an app..."
            onChange={({ currentTarget }) =>
              self.setState({ searchTerm: currentTarget.value })
            }
          />
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center"
          }}
        >
          {apps.length ? (
            apps.length && apps.map(app => self.createOneClickApp(app))
          ) : (
            <div>
              <Empty description="No matching App" />
              <div style={{ paddingTop: 30 }}>
                What if the app/database I want is not listed here? &nbsp;
                <NewTabLink url="https://caprover.com/docs/one-click-apps.html#what-about-other-apps">
                  <Icon type="info-circle" />
                </NewTabLink>
              </div>
            </div>
          )}
        </div>
      </Fragment>
    );
  }
}
