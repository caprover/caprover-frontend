import React, { useContext } from "react";
import { Col, Input, Row, Tooltip } from "antd";
import { AppDetailsContext, IAppDetailsContext } from "../../AppDetailsProvider";

export default () => {
  const context: IAppDetailsContext = useContext(AppDetailsContext)!;
  const { appDefinition: app, isMobile } = context;

  return (
    <Row>
      <Col
        xs={{ span: 24 }}
        lg={{ span: 6 }}
        style={{ width: isMobile ? "100%" : 300 }}
      >
        <Tooltip title="HTTP port inside the container. Default is 80. Change only if the app is running in a different port. This is used only for HTTP apps, not databases.">
          <Input
            addonBefore={`Container ${
              isMobile ? " " : "HTTP "
            }Port`}
            type="number"
            defaultValue={
              app.containerHttpPort ? app.containerHttpPort + "" : ""
            }
            onChange={e =>
              context.updateAppDefintion({ containerHttpPort: Number(e.target.value) })
            }
          />
        </Tooltip>
      </Col>
    </Row>
  );
};
