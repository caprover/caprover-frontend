import { Alert, Card, Col, Icon, Input, Row, Empty, Skeleton } from "antd";
import { useHistory } from "react-router-dom";
import React, { FunctionComponent, useState, useEffect } from "react";
import { RouteComponentProps } from "react-router";
import {
  useOneClickApp,
  useOneClickAppList
} from "../../../api/OneClickAppsApi";
import { IOneClickAppIdentifier } from "../../../models/IOneClickAppModels";
import Utils from "../../../utils/Utils";
import CenteredSpinner from "../../global/CenteredSpinner";

const SafariWarning: FunctionComponent = () => {
  if (!Utils.isSafari()) return null;
  return (
    <Alert
      message="You seem to be using Safari. Deployment of one-click apps may be unstable on Safari. Using Chrome is recommended"
      type="warning"
    />
  );
};

const NewTabLink: FunctionComponent<any> = props => (
  <a
    href="https://github.com/caprover/one-click-apps/tree/master/public/v2/apps"
    target="_blank"
    rel="noopener noreferrer"
    {...props}
  />
);

const FreeTemplate = () => {
  return (
    <div>
      <div>
        <p>
          This is mainly for testing. You can copy and paste your custom
          One-Click app template here. See{" "}
          <NewTabLink href="https://github.com/caprover/one-click-apps/tree/master/public/v2/apps">
            the main one click apps GitHub repository
          </NewTabLink>{" "}
          for samples and ideas.
        </p>
      </div>

      <Input.TextArea className="code-input" rows={10} />
    </div>
  );
};

const OneClickApp: FunctionComponent<{ name: string }> = ({ name }) => {
  const app = useOneClickApp(name);
  const history = useHistory();

  return (
    <Card
      onClick={() => history.push(name)}
      cover={<img src={(app && app.logo) || "/icon-512x512.png"} />}
      className="one-click-app"
      hoverable
    >
      <Card.Meta
        title={(app && app.displayName) || name}
        description={app ? app.documentation : <Skeleton active />}
      />
    </Card>
  );
};

const OneClickAppSelector: FunctionComponent<RouteComponentProps<any>> = () => {
  const [apps, filter] = useOneClickAppList();

  return (
    <Row type="flex" justify="center">
      <Col xs={{ span: 23 }} lg={{ span: 16 }}>
        <Card title="One Click Apps">
          <p>
            Choose an app, a database or a bundle (app+database) from the list
            below. The rest is magic, well... Wizard!
          </p>
          <p>
            One click apps are retrieved from :{" "}
            <NewTabLink href="https://github.com/caprover/one-click-apps">
              CapRover One Click Apps Repository
            </NewTabLink>
          </p>

          <SafariWarning />

          <Input.Search
            placeholder="Search by name..."
            loading={!apps}
            size="large"
            style={{ margin: "2em 0 1em 0" }}
            onChange={({ currentTarget }) => filter(currentTarget.value)}
          />

          <NewTabLink href="https://caprover.com/docs/one-click-apps.html#what-about-other-apps">
            <Icon type="info-circle" /> What if the app/database I want is not
            listed here?
          </NewTabLink>

          {!apps && <CenteredSpinner />}
          {apps && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center"
              }}
            >
              {apps.length ? (
                apps.length &&
                apps.map(app => <OneClickApp key={app} name={app} />)
              ) : (
                <Empty description="No matching App" />
              )}
            </div>
          )}

          <FreeTemplate />
        </Card>
      </Col>
    </Row>
  );
};

export default OneClickAppSelector;
