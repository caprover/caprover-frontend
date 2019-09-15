import React, { useContext } from "react";
import { Col, Input, Row, Tooltip } from "antd";
import { AppDetailsContext } from "../../AppDetailsProvider";

const ContainerPort = () => {
  const context: AppDetailsContext = useContext(AppDetailsContext);
  const { app } = context.currentApp();

  return (
    <Row>
      <Col
        xs={{ span: 24 }}
        lg={{ span: 6 }}
        style={{ width: context.isMobile ? "100%" : 300 }}
      >
        <Tooltip title="HTTP port inside the container. Default is 80. Change only if the app is running in a different port. This is used only for HTTP apps, not databases.">
          <Input
            addonBefore={`Container ${
              context.isMobile ? " " : "HTTP "
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

export default ContainerPort;
