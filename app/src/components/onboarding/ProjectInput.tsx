import type { ChangeEvent } from "react";
import { Loader2 } from "lucide-react";
import { GithubIcon } from "../icons/GithubIcon";
import { INPUT_CLASS, LABEL_CLASS, PANEL_CLASS, TEXTAREA_CLASS } from "./constants";
import type { ProjectInputProps } from "./types";

interface FieldProps {
  value: string;
  onChange: (value: string) => void;
}

function ManifestField({ value, onChange }: FieldProps) {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>package.json</span>
      <textarea
        className={TEXTAREA_CLASS}
        value={value}
        onChange={handleChange}
        spellCheck={false}
      />
    </label>
  );
}

function RepoUrlField({ value, onChange }: FieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label className="flex flex-col gap-2">
      <span className={LABEL_CLASS}>GitHub repository URL</span>
      <input
        className={INPUT_CLASS}
        value={value}
        onChange={handleChange}
        placeholder="https://github.com/owner/repo"
        type="url"
      />
    </label>
  );
}

function LoadIcon({ isLoading }: { isLoading: boolean }) {
  if (isLoading) return <Loader2 className="size-4 animate-spin" />;
  return <GithubIcon className="size-4" />;
}

function LoadRepoButton({ isLoading, onLoadRepo }: { isLoading: boolean; onLoadRepo: () => void }) {
  return (
    <button
      type="button"
      className="btn btn-primary rounded-xl"
      onClick={onLoadRepo}
      disabled={isLoading}
    >
      <LoadIcon isLoading={isLoading} />
      Load package.json
    </button>
  );
}

const getStatusClassName = (status: string): string => {
  if (status === "error") return "text-error";
  return "text-base-content/60";
};

function RepoStatus({ status, message }: { status: string; message: string }) {
  const statusClassName = getStatusClassName(status);

  return <p className={`text-sm ${statusClassName}`}>{message}</p>;
}

export function ProjectInput({
  packageJsonText,
  repoUrl,
  repoState,
  onPackageJsonChange,
  onRepoUrlChange,
  onLoadRepo,
}: ProjectInputProps) {
  const isLoading = repoState.status === "loading";

  return (
    <section className={PANEL_CLASS}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.44fr)]">
        <ManifestField value={packageJsonText} onChange={onPackageJsonChange} />
        <aside className="flex flex-col gap-4">
          <RepoUrlField value={repoUrl} onChange={onRepoUrlChange} />
          <LoadRepoButton isLoading={isLoading} onLoadRepo={onLoadRepo} />
          <RepoStatus status={repoState.status} message={repoState.message} />
        </aside>
      </div>
    </section>
  );
}
