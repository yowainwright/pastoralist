import { execFile } from "child_process";
import { promisify } from "util";
import { logger } from "../utils";

const execFileAsync = promisify(execFile);

export interface CLIInstallOptions {
  packageName: string;
  cliCommand: string;
  debug?: boolean;
}

export class CLIInstaller {
  private log: ReturnType<typeof logger>;

  constructor(options: { debug?: boolean } = {}) {
    this.log = logger({ file: "security/cli-installer.ts", isLogging: options.debug });
  }

  async isInstalled(command: string): Promise<boolean> {
    try {
      await execFileAsync("which", [command]);
      return true;
    } catch {
      return false;
    }
  }

  async isInstalledGlobally(packageName: string): Promise<boolean> {
    try {
      const { stdout } = await execFileAsync("npm", ["list", "-g", packageName, "--depth=0"]);
      return stdout.includes(packageName);
    } catch {
      return false;
    }
  }

  async installGlobally(packageName: string): Promise<void> {
    this.log.info(`Installing ${packageName} globally...`, "installGlobally");

    try {
      await execFileAsync("npm", ["install", "-g", packageName], {
        timeout: 120000,
      });
      this.log.info(`Successfully installed ${packageName}`, "installGlobally");
    } catch (error) {
      this.log.error(`Failed to install ${packageName}`, "installGlobally", { error });
      throw new Error(`Failed to install ${packageName}: ${error}`);
    }
  }

  async ensureInstalled(options: CLIInstallOptions): Promise<boolean> {
    const { packageName, cliCommand } = options;

    const isCommandAvailable = await this.isInstalled(cliCommand);

    if (isCommandAvailable) {
      this.log.debug(`${cliCommand} is already installed`, "ensureInstalled");
      return true;
    }

    const isGloballyInstalled = await this.isInstalledGlobally(packageName);

    if (isGloballyInstalled) {
      this.log.debug(`${packageName} is installed globally but command not in PATH`, "ensureInstalled");
      return true;
    }

    this.log.info(`${cliCommand} not found, installing ${packageName}...`, "ensureInstalled");

    try {
      await this.installGlobally(packageName);

      const isNowInstalled = await this.isInstalled(cliCommand);

      if (!isNowInstalled) {
        this.log.info(
          `${packageName} was installed but ${cliCommand} is still not available. Please ensure it's in your PATH.`,
          "ensureInstalled"
        );
        return false;
      }

      return true;
    } catch (error) {
      this.log.error(`Could not install ${packageName}`, "ensureInstalled", { error });
      return false;
    }
  }

  async getVersion(command: string): Promise<string | undefined> {
    try {
      const { stdout } = await execFileAsync(command, ["--version"]);
      return stdout.trim();
    } catch {
      return undefined;
    }
  }
}
