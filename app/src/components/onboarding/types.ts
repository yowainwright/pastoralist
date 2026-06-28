import type { LucideIcon } from "lucide-react";
import type {
  AnalyzePackageJsonResult,
  OnboardingAnalysis,
  PackageManager,
} from "@/lib/onboarding";

export type RepoLoadState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "loaded"; message: string }
  | { status: "error"; message: string };

export interface OnboardingState {
  packageJsonText: string;
  repoUrl: string;
  repoState: RepoLoadState;
  result: AnalyzePackageJsonResult;
  shareUrl: string;
  setPackageJsonText: (value: string) => void;
  setRepoUrl: (value: string) => void;
  loadRepo: () => Promise<void>;
}

export interface RepoLoaderActions {
  setPackageJsonText: (value: string) => void;
  setLockPackageManager: (value: PackageManager | undefined) => void;
  setRepoState: (value: RepoLoadState) => void;
}

export interface ProjectInputProps {
  packageJsonText: string;
  repoUrl: string;
  repoState: RepoLoadState;
  onPackageJsonChange: (value: string) => void;
  onRepoUrlChange: (value: string) => void;
  onLoadRepo: () => void;
}

export interface AnalysisProps {
  analysis: OnboardingAnalysis;
}

export interface MetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}
