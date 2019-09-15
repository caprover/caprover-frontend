import Utils from "../../../utils/Utils";
import Login from "../../Login";
import ApiManager from "../../../api/ApiManager";

export class LogFetcher {
  private apiManager: ApiManager | null;
  private callback: Function;
  private timer: NodeJS.Timeout | null = null;
  started: boolean;
  appName: string;

  constructor(apiManager:ApiManager, appName: string, callback: Function) {
    this.apiManager = apiManager;
    this.started = false;
    this.callback = callback;
    this.started = false;
    this.appName = appName;
  }

  async fetchAppLogs(): Promise<({ appLogs: string | undefined, error: Error | undefined })> {
    if (!this.started || !this.apiManager) {
      return { appLogs: undefined, error: undefined }
    }

    // See https://docs.docker.com/engine/api/v1.30/#operation/ContainerAttach for logs headers
    const separators = [
      "00000000",
      "01000000",
      "02000000",
      "03000000" // This is not in the Docker docs, but can actually happen when the log stream is broken https://github.com/caprover/caprover/issues/366
    ];

    const ansiRegex = Utils.getAnsiColorRegex();
    let logs: { appLogs: string | undefined, error: Error | undefined } | null = null;

    try{
      const logInfo: { logs: string } = await this.apiManager!.fetchAppLogsInHex(this.appName)
      const logsProcessed = logInfo.logs
        .split(new RegExp(separators.join("|"), "g"))
        .map(rawRow => {
          let time = 0;

          let textUtf8 = Utils.convertHexStringToUtf8(rawRow);

          try {
            time = new Date(textUtf8.substring(0, 30)).getTime();
          } catch (err) {
            // ignore... it's just a failure in fetching logs. Ignore to avoid additional noise in console
          }

          return {
            text: textUtf8,
            time: time
          };
        })
        .sort((a, b) => (a.time > b.time ? 1 : b.time > a.time ? -1 : 0))
        .map(a => {
          return a.text;
        })
        .join("")
        .replace(ansiRegex, "");

      logs = { appLogs: logsProcessed, error: undefined };
    } catch(error) {
      console.log(error)
      logs = { appLogs: undefined, error }
    }

    return logs
  }

  async fetchLogs() {
    if (!this.started) {
      return
    }

    const { appLogs, error: appLogsError }  = await this.fetchAppLogs()
    const { buildLogs, error: buildLogsError } = await this.fetchBuildLogs()

    if (!this.started) {
      return
    }

    this.callback({ appLogs, buildLogs }, appLogsError || buildLogsError)

    this.timer = setTimeout(async () =>
      this.fetchLogs()
    , 2000)
  }

  async fetchBuildLogs(): Promise<({ buildLogs: any, error: Error | undefined })> {
    if (!this.started || !this.apiManager) {
      return { buildLogs: undefined, error: undefined }
    }

    try {
      const buildLogs : {
        isAppBuilding: boolean;
        isBuildFailed: boolean;
        logs: {
          firstLineNumber: number;
          lines: string[];
        }
      } = await this.apiManager!.fetchBuildLogs(this.appName)

      return { buildLogs, error: undefined }
    } catch(error) {
      console.log(error)
      return  { error, buildLogs: undefined }
    }
  }

  start() {
    this.started = true
    this.fetchLogs()
  }

  stop() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
    this.started = false
    this.apiManager = null
  }
}
