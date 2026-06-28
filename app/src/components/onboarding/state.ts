import { useMemo, useState } from "react";
import {
  analyzePackageJson,
  buildShareUrl,
  DEFAULT_PACKAGE_JSON,
  loadPackageJsonFromGitHub,
  readSharedPackageJsonFromSearch,
  type LoadedPackageJson,
  type PackageManager,
} from "@/lib/onboarding";
import { INITIAL_REPO_STATE, LOADING_REPO_STATE } from "./constants";
import type { OnboardingState, RepoLoaderActions, RepoLoadState } from "./types";

const hasBrowserWindow = (): boolean => typeof window !== "undefined";

const getInitialPackageJsonText = (): string => {
  if (!hasBrowserWindow()) return DEFAULT_PACKAGE_JSON;
  return readSharedPackageJsonFromSearch(window.location.search);
};

const getShareUrl = (packageJsonText: string): string => {
  if (!hasBrowserWindow()) return "";
  return buildShareUrl(window.location.origin, window.location.pathname, packageJsonText);
};

const getLoadedRepoState = (data: LoadedPackageJson): RepoLoadState => ({
  status: "loaded",
  message: data.sourceUrl,
});

const getErrorRepoState = (message: string): RepoLoadState => ({
  status: "error",
  message,
});

const applyLoadedPackageJson = (data: LoadedPackageJson, actions: RepoLoaderActions): void => {
  actions.setPackageJsonText(data.text);
  actions.setLockPackageManager(data.lockPackageManager);
  actions.setRepoState(getLoadedRepoState(data));
};

const createRepoLoader = (repoUrl: string, actions: RepoLoaderActions) => {
  return async () => {
    actions.setRepoState(LOADING_REPO_STATE);
    const loaded = await loadPackageJsonFromGitHub(repoUrl);

    if (!loaded.ok) {
      actions.setRepoState(getErrorRepoState(loaded.error));
      return;
    }

    applyLoadedPackageJson(loaded.data, actions);
  };
};

export function useOnboardingState(): OnboardingState {
  const [packageJsonText, setPackageJsonText] = useState(getInitialPackageJsonText);
  const [repoUrl, setRepoUrl] = useState("");
  const [repoState, setRepoState] = useState(INITIAL_REPO_STATE);
  const [lockPackageManager, setLockPackageManager] = useState<PackageManager | undefined>();
  const result = useMemo(
    () => analyzePackageJson(packageJsonText, lockPackageManager),
    [packageJsonText, lockPackageManager],
  );
  const shareUrl = useMemo(() => getShareUrl(packageJsonText), [packageJsonText]);
  const actions = { setPackageJsonText, setLockPackageManager, setRepoState };
  const loadRepo = createRepoLoader(repoUrl, actions);

  return {
    packageJsonText,
    repoUrl,
    repoState,
    result,
    shareUrl,
    setPackageJsonText,
    setRepoUrl,
    loadRepo,
  };
}
