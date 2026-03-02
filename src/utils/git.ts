import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "util";

const execFile = promisify(execFileCallback);

const DEFAULT_FALLBACK = () => new Date().toISOString();

const runGitLog = async (filePath: string): Promise<string> => {
  const { stdout } = await execFile("git", [
    "log",
    "--diff-filter=A",
    "--follow",
    "--format=%aI",
    "-1",
    "--",
    filePath,
  ]);
  return stdout.trim();
};

export const getOverrideGitDate = async (
  filePath: string = "package.json",
  fallback: () => string = DEFAULT_FALLBACK,
): Promise<string> => {
  try {
    const gitDate = await runGitLog(filePath);
    const hasGitDate = gitDate.length > 0;
    return hasGitDate ? gitDate : fallback();
  } catch {
    return fallback();
  }
};
