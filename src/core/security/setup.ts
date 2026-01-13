import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { existsSync, readFileSync, appendFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { logger } from "../../utils";
import { green, yellow, cyan, gray, red } from "../../utils/colors";
import {
  promptConfirm,
  promptSelect,
  promptInput,
  PromptFunctions,
} from "./utils";
import {
  DEFAULT_CLI_TIMEOUT,
  PROVIDER_CONFIGS,
  VALIDATION_ENDPOINTS,
  GH_MESSAGES,
} from "./constants";
import type { SecurityProvider, ProviderConfig } from "./constants";

const execFileAsync = promisify(execFile);

export interface SetupResult {
  success: boolean;
  token?: string;
  savedToProfile?: boolean;
  usedCli?: boolean;
  message: string;
}

interface OutputFunctions {
  log: (msg: string) => void;
  success: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
  info: (msg: string) => void;
}

const createOutput = (): OutputFunctions => ({
  log: (msg: string) => process.stdout.write(`${msg}\n`),
  success: (msg: string) => process.stdout.write(`${green("[OK]")} ${msg}\n`),
  warn: (msg: string) => process.stdout.write(`${yellow("[WARN]")} ${msg}\n`),
  error: (msg: string) => process.stdout.write(`${red("[FAIL]")} ${msg}\n`),
  info: (msg: string) => process.stdout.write(`${gray(msg)}\n`),
});

export class SecuritySetupWizard {
  private log: ReturnType<typeof logger>;
  private prompts: PromptFunctions;
  private skipBrowserOpen: boolean;
  private out: OutputFunctions;

  constructor(options: { debug?: boolean; skipBrowserOpen?: boolean } = {}) {
    this.log = logger({
      file: "security/setup.ts",
      isLogging: options.debug,
    });
    this.prompts = {
      confirm: promptConfirm,
      select: promptSelect,
      input: promptInput,
    };
    this.skipBrowserOpen = options.skipBrowserOpen || false;
    this.out = createOutput();
  }

  async checkTokenAvailable(provider: SecurityProvider): Promise<boolean> {
    const config = PROVIDER_CONFIGS[provider];
    const noEnvVarNeeded = !config.envVar;

    if (noEnvVarNeeded) {
      return true;
    }

    const envVar = config.envVar as string;
    const hasEnvToken = !!process.env[envVar];
    if (hasEnvToken) {
      return true;
    }

    const isGitHubWithCli = provider === "github" && config.cliAlternative;
    if (!isGitHubWithCli) {
      return false;
    }

    return this.isGhCliAuthenticated();
  }

  private async isGhCliAuthenticated(): Promise<boolean> {
    try {
      const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
      await execFileAsync("gh", ["auth", "status"], execOptions);
      return true;
    } catch {
      return false;
    }
  }

  private printSetupHeader(providerName: string): void {
    const divider = cyan("=".repeat(50));
    const title = cyan("Security Provider Setup:");
    this.out.log(`\n${divider}`);
    this.out.log(`${title} ${providerName}`);
    this.out.log(`${divider}\n`);
  }

  async runSetup(provider: SecurityProvider): Promise<SetupResult> {
    const config = PROVIDER_CONFIGS[provider];

    this.printSetupHeader(config.name);

    const noEnvVarNeeded = !config.envVar;
    if (noEnvVarNeeded) {
      return {
        success: true,
        message: "OSV requires no setup - you're good to go!",
      };
    }

    const existingTokenResult = await this.checkExistingToken(provider, config);
    if (existingTokenResult) {
      return existingTokenResult;
    }

    const ghCliResult = await this.tryGitHubCliIfApplicable(provider);
    if (ghCliResult) {
      return ghCliResult;
    }

    return this.runTokenSetup(provider, config);
  }

  private async checkExistingToken(
    provider: SecurityProvider,
    config: ProviderConfig,
  ): Promise<SetupResult | null> {
    const existingToken = process.env[config.envVar!];
    const hasExistingToken = !!existingToken;

    if (!hasExistingToken) {
      return null;
    }

    const isValid = await this.validateToken(provider, existingToken);
    if (!isValid) {
      this.out.warn(`Existing ${config.envVar} appears invalid or expired.\n`);
      return null;
    }

    return {
      success: true,
      token: existingToken,
      message: `${config.envVar} is already configured and working!`,
    };
  }

  private async tryGitHubCliIfApplicable(
    provider: SecurityProvider,
  ): Promise<SetupResult | null> {
    const isGitHub = provider === "github";
    if (!isGitHub) {
      return null;
    }

    const ghResult = await this.tryGitHubCliSetup();
    if (!ghResult.success) {
      return null;
    }

    return ghResult;
  }

  private async tryGitHubCliSetup(): Promise<SetupResult> {
    const hasGh = await this.isCommandAvailable("gh");

    if (!hasGh) {
      return this.handleMissingGhCli();
    }

    const isAuthed = await this.isGhCliAuthenticated();
    if (isAuthed) {
      this.out.success("GitHub CLI is installed and authenticated!\n");
      return {
        success: true,
        usedCli: true,
        message: "Using GitHub CLI for authentication",
      };
    }

    this.out.log("GitHub CLI is installed but not authenticated.\n");
    const useGh = await this.prompts.confirm(
      "Would you like to authenticate with GitHub CLI? (recommended)",
      true,
    );

    if (!useGh) {
      return { success: false, message: "Proceeding with token setup" };
    }

    return this.runGhAuth();
  }

  private async handleMissingGhCli(): Promise<SetupResult> {
    this.out.log("GitHub CLI (gh) is not installed.\n");
    const installChoice = await this.prompts.select(
      "How would you like to authenticate with GitHub?",
      [
        { name: "Install GitHub CLI (recommended)", value: "install-gh" },
        { name: "Use a Personal Access Token", value: "token" },
        { name: "Skip setup", value: "skip" },
      ],
    );

    const shouldInstall = installChoice === "install-gh";
    if (shouldInstall) {
      return this.installAndAuthGh();
    }

    const shouldSkip = installChoice === "skip";
    if (shouldSkip) {
      return { success: false, message: "Setup skipped" };
    }

    return { success: false, message: "Proceeding with token setup" };
  }

  private async runGhAuth(): Promise<SetupResult> {
    this.out.log("\nStarting GitHub CLI authentication...\n");
    this.out.info("This will open a browser for you to authenticate.\n");

    try {
      await this.spawnGhAuth();

      const isAuthed = await this.isGhCliAuthenticated();
      if (isAuthed) {
        this.out.success("GitHub CLI authenticated successfully!\n");
        return {
          success: true,
          usedCli: true,
          message: "Authenticated via GitHub CLI",
        };
      }
    } catch (error) {
      this.log.debug("gh auth failed", "runGhAuth", { error });
    }

    this.out.warn("GitHub CLI authentication did not complete.\n");
    return { success: false, message: "GitHub CLI auth failed" };
  }

  private spawnGhAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(
        "gh",
        ["auth", "login", "--web", "-h", "github.com"],
        {
          stdio: "inherit",
        },
      );

      child.on("close", (code) => {
        const success = code === 0;
        if (success) {
          resolve();
        } else {
          reject(new Error(`gh auth exited with code ${code}`));
        }
      });

      child.on("error", reject);
    });
  }

  private async installAndAuthGh(): Promise<SetupResult> {
    const platform = process.platform;
    const isLinux = platform === "linux";
    const isMac = platform === "darwin";
    const manualInstallMsg = "Manual gh install required";

    this.out.log("\n" + GH_MESSAGES.INSTALLING + "\n");

    if (isLinux) {
      this.out.warn(GH_MESSAGES.LINUX_INSTALL);
      return { success: false, message: manualInstallMsg };
    }

    if (!isMac) {
      this.out.warn(GH_MESSAGES.MANUAL_INSTALL);
      return { success: false, message: manualInstallMsg };
    }

    try {
      this.out.info(GH_MESSAGES.BREW_CMD + "\n");
      await execFileAsync("brew", ["install", "gh"], { timeout: 120000 });
      this.out.success(GH_MESSAGES.INSTALLED + "\n");
      return this.runGhAuth();
    } catch (error) {
      this.log.debug("gh install failed", "installAndAuthGh", { error });
      this.out.warn(GH_MESSAGES.INSTALL_FAILED + "\n");
      this.out.log(GH_MESSAGES.MANUAL_INSTALL);
      return { success: false, message: "gh install failed" };
    }
  }

  private async runTokenSetup(
    provider: SecurityProvider,
    config: ProviderConfig,
  ): Promise<SetupResult> {
    this.out.log(`\nTo use ${config.name}, you'll need an API token.\n`);

    config.setupSteps.forEach((step) => this.out.log(`  ${step}`));

    const hasRequiredScopes = !!config.requiredScopes;
    if (hasRequiredScopes) {
      this.out.log(`\n  Required scopes: ${config.requiredScopes!.join(", ")}`);
    }

    this.out.log("");

    const shouldOfferBrowserOpen = config.tokenUrl && !this.skipBrowserOpen;
    if (shouldOfferBrowserOpen) {
      const openBrowser = await this.prompts.confirm(
        `Open ${config.tokenUrl} in your browser?`,
        true,
      );

      if (openBrowser) {
        await this.openUrl(config.tokenUrl!);
        this.out.info("\nBrowser opened. Create your token there.\n");
      }
    }

    this.out.info("Tip: The token will be hidden as you type for security.\n");

    const token = await this.prompts.input(
      `Paste your ${config.name} token here`,
    );

    const noTokenProvided = !token;
    if (noTokenProvided) {
      return { success: false, message: "No token provided" };
    }

    this.out.log("\nValidating token...");
    const isValid = await this.validateToken(provider, token);

    if (!isValid) {
      return this.handleInvalidToken(config);
    }

    this.out.success("Token is valid!\n");

    const saveToProfile = await this.prompts.confirm(
      "Save token to your shell profile for future use?",
      true,
    );

    const savedToProfile = saveToProfile
      ? await this.saveToShellProfile(config.envVar!, token)
      : false;

    process.env[config.envVar!] = token;

    const tokenPreview = `${token.slice(0, 8)}...`;
    const persistMessage = `Token set for this session. Set ${config.envVar}=${tokenPreview} in your environment to persist.`;
    const savedMessage =
      "Token saved to shell profile. Restart your terminal or run 'source ~/.zshrc' to use it globally.";
    const message = savedToProfile ? savedMessage : persistMessage;

    return {
      success: true,
      token,
      savedToProfile,
      message,
    };
  }

  private handleInvalidToken(config: ProviderConfig): SetupResult {
    this.out.error("Token validation failed.\n");
    this.out.log("Please check that:");
    this.out.log("  - The token was copied correctly");
    this.out.log("  - The token has the required permissions");

    const hasRequiredScopes = !!config.requiredScopes;
    if (hasRequiredScopes) {
      this.out.log(`  - Scopes include: ${config.requiredScopes!.join(", ")}`);
    }

    return { success: false, message: "Token validation failed" };
  }

  async validateToken(
    provider: SecurityProvider,
    token: string,
  ): Promise<boolean> {
    try {
      const isGitHub = provider === "github";
      if (isGitHub) {
        return this.validateGitHubToken(token);
      }

      const isSnyk = provider === "snyk";
      if (isSnyk) {
        return this.validateSnykToken(token);
      }

      const isSocket = provider === "socket";
      if (isSocket) {
        return this.validateSocketToken(token);
      }

      return true;
    } catch (error) {
      this.log.debug("Token validation error", "validateToken", { error });
      return false;
    }
  }

  private async validateGitHubToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(VALIDATION_ENDPOINTS.github, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async validateSnykToken(token: string): Promise<boolean> {
    try {
      const response = await fetch(VALIDATION_ENDPOINTS.snyk, {
        headers: {
          Authorization: `token ${token}`,
        },
      });
      const isOk = response.ok;
      const is404 = response.status === 404;
      return isOk || is404;
    } catch {
      return false;
    }
  }

  private async validateSocketToken(token: string): Promise<boolean> {
    try {
      const credentials = Buffer.from(`${token}:`).toString("base64");
      const response = await fetch(VALIDATION_ENDPOINTS.socket, {
        headers: {
          Authorization: `Basic ${credentials}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async isCommandAvailable(command: string): Promise<boolean> {
    try {
      const execOptions = { timeout: DEFAULT_CLI_TIMEOUT };
      await execFileAsync("which", [command], execOptions);
      return true;
    } catch {
      return false;
    }
  }

  private async openUrl(url: string): Promise<void> {
    const platform = process.platform;
    const isMac = platform === "darwin";
    const isLinux = platform === "linux";
    const isWindows = platform === "win32";

    try {
      if (isMac) {
        await execFileAsync("open", [url]);
        return;
      }

      if (isLinux) {
        await execFileAsync("xdg-open", [url]);
        return;
      }

      if (isWindows) {
        await execFileAsync("cmd", ["/c", "start", url]);
        return;
      }
    } catch (error) {
      this.log.debug("Failed to open URL", "openUrl", { error });
    }

    this.out.log(`Please open manually: ${url}`);
  }

  private async saveToShellProfile(
    envVar: string,
    token: string,
  ): Promise<boolean> {
    const home = homedir();
    const shellProfiles = [".zshrc", ".bashrc", ".bash_profile"];
    const profilePath = this.findShellProfile(home, shellProfiles);

    try {
      const content = readFileSync(profilePath, "utf-8");
      const exportLine = `export ${envVar}=`;
      const alreadyExists = content.includes(exportLine);

      if (alreadyExists) {
        this.out.warn(`${envVar} already exists in ${profilePath}. Skipping.`);
        this.out.log(`To update it, edit ${profilePath} manually.`);
        return false;
      }

      const newLine = `\n# Added by pastoralist\nexport ${envVar}="${token}"\n`;
      appendFileSync(profilePath, newLine);

      this.out.success(`Added ${envVar} to ${profilePath}\n`);
      return true;
    } catch (error) {
      this.log.debug("Failed to save to profile", "saveToShellProfile", {
        error,
      });
      this.out.warn(`Couldn't write to ${profilePath}.`);
      this.out.log(`Add this to your shell profile manually:`);
      this.out.log(`  export ${envVar}="${token}"`);
      return false;
    }
  }

  private findShellProfile(home: string, profiles: string[]): string {
    const found = profiles.find((profile) => existsSync(join(home, profile)));
    const defaultProfile = join(home, ".zshrc");
    return found ? join(home, found) : defaultProfile;
  }
}

export async function promptForSetup(
  provider: SecurityProvider,
  options: { debug?: boolean } = {},
): Promise<SetupResult> {
  const wizard = new SecuritySetupWizard(options);
  const out = createOutput();

  const hasToken = await wizard.checkTokenAvailable(provider);

  if (hasToken) {
    return {
      success: true,
      message: `${PROVIDER_CONFIGS[provider].name} is already configured.`,
    };
  }

  const config = PROVIDER_CONFIGS[provider];

  out.warn(`No ${config.name} authentication found.\n`);

  const wantsSetup = await promptConfirm(
    `Would you like help setting up ${config.name}?`,
    true,
  );

  if (!wantsSetup) {
    return {
      success: false,
      message: `Skipped ${config.name} setup. Security scan may be limited.`,
    };
  }

  return wizard.runSetup(provider);
}

export type { SecurityProvider };
