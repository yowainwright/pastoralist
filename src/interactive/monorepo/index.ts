import { logger } from "../../scripts";
import { Options } from "../../interfaces";
import { createPrompt } from "../prompt";
import {
  WORKSPACE_TYPES,
  MAIN_ACTION_CHOICES,
  WORKSPACE_STRUCTURE_CHOICES,
  DEFAULTS,
  MESSAGES
} from "../constants";
import type { MonorepoPromptResult, MainAction, WorkspaceType } from "../types";

export class InteractiveMonorepoManager {
  private log: ReturnType<typeof logger>;

  constructor(debug: boolean = false) {
    this.log = logger({ file: "interactive/monorepo/index.ts", isLogging: debug });
  }

  async promptForMonorepoConfiguration(
    missingPackages: string[],
    options: Options
  ): Promise<MonorepoPromptResult> {
    this.displayMissingPackages(missingPackages);

    return createPrompt(async (prompt) => {
      const action = await this.getMainAction(prompt) as MainAction;

      switch (action) {
        case "learn-more":
          await this.showMonorepoHelp(prompt);
          return this.promptForMonorepoConfiguration(missingPackages, options);

        case "skip": {
          const confirmed = await this.confirmSkip(prompt, missingPackages);
          return confirmed
            ? { action: "skip" }
            : this.promptForMonorepoConfiguration(missingPackages, options);
        }

        case "auto-detect":
          return this.handleAutoDetect(prompt);

        case "manual-paths":
          return this.handleManualPaths(prompt);

        case "override-path":
          return this.handleOverridePath(prompt, missingPackages);

        default:
          return { action: "skip" };
      }
    });
  }

  private displayMissingPackages(packages: string[]): void {
    console.log(`\n${MESSAGES.monorepoDetected}`);
    console.log(`Found ${packages.length} override(s) not in root dependencies:`);
    packages.forEach(pkg => console.log(`  • ${pkg}`));
  }

  private async getMainAction(prompt: any): Promise<string> {
    return prompt.list("Configure monorepo support:", MAIN_ACTION_CHOICES);
  }

  private async handleAutoDetect(prompt: any): Promise<MonorepoPromptResult> {
    const depPaths = await this.getWorkspacePaths(prompt);
    const confirmed = await prompt.confirm(
      `Use: ${depPaths.join(", ")}?`,
      DEFAULTS.confirmChoice
    );

    if (!confirmed) {
      return this.handleManualPaths(prompt);
    }

    return this.getSavePreference(prompt, depPaths);
  }

  private async getWorkspacePaths(prompt: any): Promise<string[]> {
    const type = await prompt.list(
      "Workspace structure:",
      WORKSPACE_STRUCTURE_CHOICES
    ) as WorkspaceType;

    if (type === "custom") {
      const paths = await prompt.input(
        "Enter paths (space-separated):",
        DEFAULTS.customPath
      );
      return paths.split(/\s+/).filter(p => p.trim());
    }

    return WORKSPACE_TYPES[type] || [];
  }

  private async handleManualPaths(prompt: any): Promise<MonorepoPromptResult> {
    const paths = await prompt.input(
      "Enter paths (space-separated):",
      DEFAULTS.customPath
    );
    const depPaths = paths.split(/\s+/).filter(p => p.trim());

    return this.getSavePreference(prompt, depPaths);
  }

  private async handleOverridePath(
    prompt: any,
    missingPackages: string[]
  ): Promise<MonorepoPromptResult> {
    const firstPackage = missingPackages[0];
    const overridePath = await prompt.input(
      `Where is "${firstPackage}" used?`,
      DEFAULTS.customPath
    );

    return { action: "manual", overridePath };
  }

  private async getSavePreference(
    prompt: any,
    depPaths: string[]
  ): Promise<MonorepoPromptResult> {
    const save = await prompt.confirm("Save to package.json?", DEFAULTS.saveConfig);

    if (save) {
      console.log(`\n${MESSAGES.saveSuccess}`);
      return { action: "save-config", depPaths, shouldSaveConfig: true };
    }

    console.log(`\n${MESSAGES.useOnceSuccess}`);
    console.log(`💡 Use: pastoralist --depPaths ${depPaths.map(p => `"${p}"`).join(" ")}`);
    return { action: "use-depPaths", depPaths };
  }

  private async confirmSkip(prompt: any, packages: string[]): Promise<boolean> {
    console.log(`\n${packages.length} ${MESSAGES.skipWarning}`);
    return prompt.confirm("Continue anyway?", DEFAULTS.skipConfirm);
  }

  private async showMonorepoHelp(prompt: any): Promise<void> {
    console.log(`\n${MESSAGES.helpTitle}`);
    console.log("Tell Pastoralist where workspace packages live so it can track overrides.\n");
    console.log("Options:");
    console.log("  • CLI: --depPaths \"packages/*/package.json\"");
    console.log("  • Config: Add paths to package.json scripts");
    console.log("  • Init: Run 'pastoralist --init' anytime to reconfigure");

    await prompt.confirm("Continue?", true);
  }
}

export default InteractiveMonorepoManager;