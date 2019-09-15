import React, { useContext } from "react";
import {
  Icon,
  Tooltip,
  Checkbox,
} from "antd";
import { AppDetailsContext, IAppDetailsContext } from "../AppDetailsProvider"
import Domains from "./components/Domains";
import Nginx from "./components/Nginx";
import ContainerPort from "./components/ContainerPort";
import NginxSettings from "./components/NginxSettings";
import HttpAuth from "./components/HttpAuth";

export default () => {
  const context: IAppDetailsContext = useContext(AppDetailsContext)!;
  const { appDefinition: app } = context;

  return (
    <div>
      <p>
        Your app is internally available as{" "}
        <code>srv-captain--{app.appName}</code> to other Captain apps. In case
        of web-app, it is accessible via{" "}
        <code>{"http://srv-captain--" + app.appName}</code> from other apps.
      </p>
      <br />

      <Checkbox
        defaultChecked={app.notExposeAsWebApp}
        onChange={e => context.updateAppDefintion({ notExposeAsWebApp: !!e.target.checked })}
      >
        Do not expose as web-app
      </Checkbox>
      <Tooltip title="Use this if you don't want your app be externally available.">
        <Icon type="info-circle" />
      </Tooltip>

      <div style={{ height: 35 }} />
      {!app.notExposeAsWebApp && (
        <div>
          <Domains />

          <br />
          <br />

          <Nginx />

          <br />
          <br />

          <ContainerPort />

          <br />
          <br />

          <NginxSettings />

          <br />
          <br />

          <HttpAuth />
        </div>
      )}
    </div>
  );
};
