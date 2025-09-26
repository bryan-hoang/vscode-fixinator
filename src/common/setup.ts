import * as fs from "node:fs";
import * as path from "path";
import { EXTENSION_ROOT_DIR } from "./constants";

export interface IServerInfo {
  name: string;
}

export function loadServerDefaults(): IServerInfo {
  const packageJson = path.join(EXTENSION_ROOT_DIR, "package.json");
  const content = fs.readFileSync(packageJson).toString();
  const config = JSON.parse(content);
  return config as IServerInfo;
}
