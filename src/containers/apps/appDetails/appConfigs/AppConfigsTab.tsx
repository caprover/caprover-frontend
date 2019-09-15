import React from "react";
import EnvVars from "./components/EnvVars";
import Ports from "./components/Ports";
import Volumes from "./components/Volumes";
import Instances from "./components/Instances";
import PreDeployScript from "./components/PreDeployScript";

export default () => (
  <div>
    <EnvVars />

    <br />
    <br />
    <br />

    <Ports />

    <br />
    <br />
    <br />

    <Volumes />

    <br />

    <Instances />

    <br />
    <br />
    <br />

    <PreDeployScript />
  </div>
);
