import { IHashMapGeneric } from "./IHashMapGeneric";

export interface IOneClickAppIdentifier {
  sortScore?: number; // 0-1 and dynamically calculated based on search terms
  name: string;
  displayName: string;
  description: string;
  logoUrl: string;
  baseUrl: string;
}

export interface IOneClickVariable {
  id: string;
  label: string;
  defaultValue?: string;
  validRegex?: string;
  description?: string;
}

export interface IDockerComposeService {
  image?: string;
  volumes?: string[];
  ports?: string[];
  environment?: IHashMapGeneric<string>;
  depends_on?: string[];

  // These are CapRover property, not DockerCompose. We use this instead of image if we need to extend the image.
  dockerfileLines?: string[];
  containerHttpPort: number;
  notExposeAsWebApp: boolean; // This is actually a string "true", make sure to double negate!
}

export interface IOneClickTemplate {
  captainVersion: number;
  shortDesc: string;
  displayName: string;
  useDefaultLogo?: boolean;
  dockerCompose: {
    version: string;
    services: IHashMapGeneric<IDockerComposeService>;
  };
  instructions: {
    start: string;
    end: string;
  };
  variables: IOneClickVariable[];
}
