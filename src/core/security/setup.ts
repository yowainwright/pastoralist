import { execFile, spawn } from "child_process";
import { promisify } from "util";
import { existsSync, readFileSync, appendFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { logger } from "../../observability";
import { green, yellow, cyan, gray, red } from "../../dx/utils";
import { promptConfirm, promptSelect, promptInput, promptSecret } from "./utils";
import {
  DEFAULT_CLI_TIMEOUT,
  PROVIDER_CONFIGS,
  SETUP_MESSAGES,
  VALIDATION_ENDPOINTS,
  GH_MESSAGES,
} from "./constants";
import type {
  ProviderConfig,
  SetupResult,
  OutputFunctions,
  PromptFunctions,
  SetupSecurityProvider,
} from "./types";

const execFileAsync = promisify(execFile);

const quoteShellValue = (value: string): string => {
  const escaped = value.replaceAll("'", "'\\''");
  const result = `'${escaped}'`;
  return result;
};

export const createOutput = (): OutputFunctions => ({
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
    const { debug: isLogging } = options;
    this.log = logger({
      file: "security/setup.ts",
      isLogging,
    });
    this.prompts = {
      confirm: promptConfirm,
      select: promptSelect,
      input: promptInput,
      secret: promptSecret,
    };
    this.skipBrowserOpen = options.skipBrowserOpen || false;
    this.out = createOutput();
  }

  checkTokenAvailable(provider: SetupSecurityProvider): boolean | Promise<boolean> {
    const config = PROVIDER_CONFIGS[provider];
    const { envVar } = config;
    if (!envVar) return true;
    const hasEnvToken = !!process.env[envVar];
    if (hasEnvToken) {
      return true;
    }

    const isGitHubWithCli = provider === "github" && config.cliAlternative;
    if (!isGitHubWithCli) {
      return false;
    }

    const result = this.isGhCliAuthenticated();
    return result;
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

  async runSetup(provider: SetupSecurityProvider): Promise<SetupResult> {
    const config = PROVIDER_CONFIGS[provider];

    this.printSetupHeader(config.name);

    const requiresToken = !!config.envVar;
    if (!requiresToken) {
      const result = {
        success: true,
        message: "OSV requires no setup - you're good to go!",
      };
      return result;
    }

    const existingTokenResult = await this.checkExistingToken(provider, config);
    if (existingTokenResult) return existingTokenResult;

    const ghCliResult = await this.tryGitHubCliIfApplicable(provider);
    if (ghCliResult) return ghCliResult;

    const tokenSetup = this.runTokenSetup(provider, config);
    return tokenSetup;
  }

  private async checkExistingToken(
    provider: SetupSecurityProvider,
    config: ProviderConfig,
  ): Promise<SetupResult | null> {
    const existingToken = process.env[config.envVar!];
    if (!existingToken) return null;

    const isValid = await this.validateToken(provider, existingToken);
    if (!isValid) {
      this.out.warn(`Existing ${config.envVar} appears invalid or expired.\n`);
      return null;
    }

    const message = `${config.envVar} is already configured and working!`;
    const result = {
      success: true,
      token: existingToken,
      message,
    };
    return result;
  }

  private async tryGitHubCliIfApplicable(
    provider: SetupSecurityProvider,
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
      const result = this.handleMissingGhCli();
      return result;
    }

    const isAuthed = await this.isGhCliAuthenticated();
    if (isAuthed) {
      this.out.success("GitHub CLI is installed and authenticated!\n");
      const message = "Using GitHub CLI for authentication";
      const result = { success: true, usedCli: true, message };
      return result;
    }

    const authSetup = this.promptGhAuth();
    return authSetup;
  }

  private async promptGhAuth(): Promise<SetupResult> {
    this.out.log("GitHub CLI is installed but not authenticated.\n");
    const useGh = await this.prompts.confirm(
      "Would you like to authenticate with GitHub CLI? (recommended)",
      true,
    );

    if (!useGh) {
      const result = { success: false, message: "Proceeding with token setup" };
      return result;
    }

    const auth = this.runGhAuth();
    return auth;
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
      const result = this.installAndAuthGh();
      return result;
    }

    const shouldSkip = installChoice === "skip";
    const message = shouldSkip ? "Setup skipped" : "Proceeding with token setup";
    const result = { success: false, message };
    return result;
  }

  private async runGhAuth(): Promise<SetupResult> {
    this.out.log("\nStarting GitHub CLI authentication...\n");
    this.out.info("This will open a browser for you to authenticate.\n");

    try {
      await this.spawnGhAuth();

      const isAuthed = await this.isGhCliAuthenticated();
      if (isAuthed) {
        const result = this.completeGhAuth();
        return result;
      }
    } catch (error) {
      this.log.debug("gh auth failed", "runGhAuth", { error });
    }

    this.out.warn("GitHub CLI authentication did not complete.\n");
    const result = { success: false, message: "GitHub CLI auth failed" };
    return result;
  }

  private completeGhAuth(): SetupResult {
    this.out.success("GitHub CLI authenticated successfully!\n");
    const result = {
      success: true,
      usedCli: true,
      message: "Authenticated via GitHub CLI",
    };
    return result;
  }

  private spawnGhAuth(): Promise<void> {
    const result = new Promise<void>((resolve, reject) => {
      const child = spawn("gh", ["auth", "login", "--web", "-h", "github.com"], {
        stdio: "inherit",
      });

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
    return result;
  }

  private async installAndAuthGh(): Promise<SetupResult> {
    const platform = process.platform;
    const isLinux = platform === "linux";
    const isMac = platform === "darwin";
    this.out.log("\n" + GH_MESSAGES.INSTALLING + "\n");

    if (!isMac) {
      const instruction = isLinux ? GH_MESSAGES.LINUX_INSTALL : GH_MESSAGES.MANUAL_INSTALL;
      this.out.warn(instruction);
      const result = { success: false, message: "Manual gh install required" };
      return result;
    }

    const installation = await this.installGhWithBrew();
    return installation;
  }

  private async installGhWithBrew(): Promise<SetupResult> {
    try {
      this.out.info(GH_MESSAGES.BREW_CMD + "\n");
      await execFileAsync("brew", ["install", "gh"], { timeout: 120000 });
      this.out.success(GH_MESSAGES.INSTALLED + "\n");
      const auth = this.runGhAuth();
      return auth;
    } catch (error) {
      this.log.debug("gh install failed", "installAndAuthGh", { error });
      this.out.warn(GH_MESSAGES.INSTALL_FAILED + "\n");
      this.out.log(GH_MESSAGES.MANUAL_INSTALL);
      const result = { success: false, message: "gh install failed" };
      return result;
    }
  }

  private async runTokenSetup(
    provider: SetupSecurityProvider,
    config: ProviderConfig,
  ): Promise<SetupResult> {
    this.printTokenSetupInstructions(config);
    await this.offerTokenPage(config);

    const token = await this.promptForToken(config);

    if (!token) {
      const { NO_TOKEN: message } = SETUP_MESSAGES;
      const result = { success: false, message };
      return result;
    }

    this.out.log(`\n${SETUP_MESSAGES.VALIDATING}`);
    const isValid = await this.validateToken(provider, token);

    const setup = isValid
      ? this.completeTokenSetup(config, token)
      : this.handleInvalidToken(config);
    return setup;
  }

  private printTokenSetupInstructions(config: ProviderConfig): void {
    this.out.log(`\nTo use ${config.name}, you'll need an API token.\n`);
    config.setupSteps.map((step) => `  ${step}`).forEach((step) => this.out.log(step));
    this.printRequiredScopes(config);
    this.out.log("");
  }

  private printRequiredScopes(config: ProviderConfig): void {
    if (!config.requiredScopes) {
      return;
    }

    this.out.log(`\n  Required scopes: ${config.requiredScopes.join(", ")}`);
  }

  private async offerTokenPage(config: ProviderConfig): Promise<void> {
    if (!this.shouldOfferBrowserOpen(config)) {
      return;
    }

    const openBrowser = await this.prompts.confirm(
      `Open ${config.tokenUrl} in your browser?`,
      true,
    );

    if (openBrowser) {
      await this.openUrl(config.tokenUrl!);
      this.out.info(`\n${SETUP_MESSAGES.BROWSER_OPENED}\n`);
    }
  }

  private shouldOfferBrowserOpen(config: ProviderConfig): boolean {
    if (!config.tokenUrl) return false;
    const result = !this.skipBrowserOpen;
    return result;
  }

  private promptForToken(config: ProviderConfig): Promise<string> {
    this.out.info(`${SETUP_MESSAGES.TOKEN_TIP}\n`);
    const readToken = this.prompts.secret ?? this.prompts.input;
    const result = readToken(`Paste your ${config.name} token here`);
    return result;
  }

  private async completeTokenSetup(config: ProviderConfig, token: string): Promise<SetupResult> {
    this.out.success(`${SETUP_MESSAGES.TOKEN_VALID}\n`);
    const savedToProfile = await this.promptForProfileSave(config, token);
    process.env[config.envVar!] = token;

    const message = this.createTokenSetupMessage(config, savedToProfile);
    const result = {
      success: true,
      token,
      savedToProfile,
      message,
    };
    return result;
  }

  private async promptForProfileSave(config: ProviderConfig, token: string): Promise<boolean> {
    this.out.warn(SETUP_MESSAGES.PLAINTEXT_WARNING);
    const saveToProfile = await this.prompts.confirm(SETUP_MESSAGES.SAVE_PROMPT, false);

    if (!saveToProfile) {
      return false;
    }

    const result = this.saveToShellProfile(config.envVar!, token);
    return result;
  }

  private createTokenSetupMessage(config: ProviderConfig, savedToProfile: boolean): string {
    if (savedToProfile) {
      const tokenSetupMessage = SETUP_MESSAGES.SAVED_TO_PROFILE;
      return tokenSetupMessage;
    }

    const message = SETUP_MESSAGES.SESSION_ONLY.replace("{envVar}", config.envVar!);
    return message;
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

    const result: SetupResult = { success: false, message: "Token validation failed" };
    return result;
  }

  validateToken(provider: SetupSecurityProvider, token: string): boolean | Promise<boolean> {
    try {
      const validators = new Map<string, (value: string) => Promise<boolean>>([
        ["github", this.validateGitHubToken],
        ["snyk", this.validateSnykToken],
        ["socket", this.validateSocketToken],
      ]);
      const validate = validators.get(provider);
      if (!validate) return true;
      const isValid = validate.call(this, token);
      return isValid;
    } catch (error) {
      this.log.debug("Token validation error", "validateToken", { error });
      return false;
    }
  }

  private async validateGitHubToken(token: string): Promise<boolean> {
    try {
      const Authorization = `Bearer ${token}`;
      const headers = { Authorization, Accept: "application/vnd.github.v3+json" };
      const response = await fetch(VALIDATION_ENDPOINTS.github, { headers });
      const isValid = response.ok;
      return isValid;
    } catch {
      return false;
    }
  }

  private async validateSnykToken(token: string): Promise<boolean> {
    try {
      const Authorization = `token ${token}`;
      const headers = { Authorization, "Content-Type": "application/vnd.api+json" };
      const response = await fetch(VALIDATION_ENDPOINTS.snyk, { headers });
      const isValid = response.ok;
      return isValid;
    } catch {
      return false;
    }
  }

  private async validateSocketToken(token: string): Promise<boolean> {
    try {
      const credentials = Buffer.from(`${token}:`).toString("base64");
      const Authorization = `Basic ${credentials}`;
      const headers = { Authorization };
      const response = await fetch(VALIDATION_ENDPOINTS.socket, { headers });
      const isValid = response.ok;
      return isValid;
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
    const commands = new Map<string, [string, string[]]>([
      ["darwin", ["open", [url]]],
      ["linux", ["xdg-open", [url]]],
      ["win32", ["cmd", ["/c", "start", url]]],
    ]);
    const command = commands.get(process.platform);
    try {
      if (command) {
        const [executable, args] = command;
        await execFileAsync(executable, args);
        return;
      }
    } catch (error) {
      this.log.debug("Failed to open URL", "openUrl", { error });
    }

    this.out.log(`Please open manually: ${url}`);
  }

  private saveToShellProfile(envVar: string, token: string): boolean {
    const home = homedir();
    const shellProfiles = [".zshrc", ".bashrc", ".bash_profile"];
    const profilePath = this.findShellProfile(home, shellProfiles);

    try {
      const result = this.writeTokenToShellProfile(profilePath, envVar, token);
      return result;
    } catch (error) {
      this.handleProfileSaveError(profilePath, envVar, error);
      return false;
    }
  }

  private writeTokenToShellProfile(profilePath: string, envVar: string, token: string): boolean {
    const content = readFileSync(profilePath, "utf-8");

    if (this.profileHasEnvVar(content, envVar)) {
      this.out.warn(`${envVar} already exists in ${profilePath}. Skipping.`);
      this.out.log(`To update it, edit ${profilePath} manually.`);
      return false;
    }

    const quotedToken = quoteShellValue(token);
    const newLine = `\n# Added by pastoralist\nexport ${envVar}=${quotedToken}\n`;
    appendFileSync(profilePath, newLine);
    this.out.success(`Added ${envVar} to ${profilePath}\n`);
    return true;
  }

  private profileHasEnvVar(content: string, envVar: string): boolean {
    const result = content.includes(`export ${envVar}=`);
    return result;
  }

  private handleProfileSaveError(profilePath: string, envVar: string, error: unknown): void {
    this.log.debug("Failed to save to profile", "saveToShellProfile", { error });
    this.out.warn(`Couldn't write to ${profilePath}.`);
    this.out.log(`Add this to your shell profile manually:`);
    this.out.log(`  export ${envVar}="<paste-token-here>"`);
  }

  private findShellProfile(home: string, profiles: string[]): string {
    const found = profiles.find((profile) => existsSync(join(home, profile)));
    const defaultProfile = join(home, ".zshrc");
    const shellProfile = found ? join(home, found) : defaultProfile;
    return shellProfile;
  }
}

export async function promptForSetup(
  provider: SetupSecurityProvider,
  options: { debug?: boolean } = {},
): Promise<SetupResult> {
  const wizard = new SecuritySetupWizard(options);
  const hasToken = await wizard.checkTokenAvailable(provider);

  if (hasToken) {
    const result = createAlreadyConfiguredResult(provider);
    return result;
  }

  const config = PROVIDER_CONFIGS[provider];
  const wantsSetup = await confirmSetupHelp(config);

  if (wantsSetup) {
    const setup = wizard.runSetup(provider);
    return setup;
  }

  const skipped = createSetupSkippedResult(config);
  return skipped;
}

function createAlreadyConfiguredResult(provider: SetupSecurityProvider): SetupResult {
  const message = `${PROVIDER_CONFIGS[provider].name} is already configured.`;
  const alreadyConfiguredResult: SetupResult = {
    success: true,
    message,
  };
  return alreadyConfiguredResult;
}

function confirmSetupHelp(config: ProviderConfig): Promise<boolean> {
  const out = createOutput();
  out.warn(`No ${config.name} authentication found.\n`);
  const result = promptConfirm(`Would you like help setting up ${config.name}?`, true);
  return result;
}

function createSetupSkippedResult(config: ProviderConfig): SetupResult {
  const message = `Skipped ${config.name} setup. Security scan may be limited.`;
  const setupSkippedResult: SetupResult = {
    success: false,
    message,
  };
  return setupSkippedResult;
}

export type { SetupSecurityProvider };
