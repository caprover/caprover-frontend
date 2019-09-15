import React, { useContext } from "react";
import { Row, Icon, Tooltip, Checkbox } from "antd";
import { AppDetailsContext, IAppDetailsContext } from "../../AppDetailsProvider";

export default () => {
  const context: IAppDetailsContext = useContext(AppDetailsContext);
  const { appDefinition: app } = context;

  return (
    <>
      <Row>
        <Checkbox
          defaultChecked={!!app.forceSsl}
          onChange={e =>
            context.updateAppDefintion({ forceSsl: !!e.target.checked })
          }
        >
          Force HTTPS by redirecting all HTTP traffic to HTTPS
        </Checkbox>
        <Tooltip title="Forcing HTTPS causes domains without HTTPS to malfunction. Make sure you enable HTTPS for the domain you want to use, before enabling Force HTTPS option.">
          <Icon type="info-circle" />
        </Tooltip>
      </Row>

      <br />
      <br />

      <Row>
        <Checkbox
          defaultChecked={!!app.websocketSupport}
          onChange={e =>
            context.updateAppDefintion({ websocketSupport: !!e.target.checked })
          }
        >
          Websocket Support
        </Checkbox>
        <Tooltip title="Adds the upgrade proxy headers to NGINX config.">
          <Icon type="info-circle" />
        </Tooltip>
      </Row>
    </>
  );
};
