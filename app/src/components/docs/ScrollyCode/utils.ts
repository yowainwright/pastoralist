import type { CalloutBounds, CalloutCandidate, CalloutEvent, Frame, Walkthrough } from "./types";

const highlightedFrames = new Map<string, Promise<string>>();

const trackingResult = `{
  "name": "shepherd-cli",
  "dependencies": {
    "express": "4.18.2"
  },
  "overrides": {
    "qs": "6.11.2"
  },
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "shepherd-cli": "qs (required by express)"
        },
        "ledger": {
          "addedDate": "2026-10-16"
        }
      }
    }
  }
}`;
const cleanupResult = `{
  "name": "shepherd-cli",
  "overrides": {}
}`;

const tracking: Walkthrough = [
  {
    id: "track-override",
    title: "Track an override",
    code: "npx pastoralist",
    lang: "bash",
    filename: "Command",
    note: "Track the existing qs override. Scroll to see the generated record.",
  },
  {
    id: "tracking-result",
    title: "Generated tracking",
    code: trackingResult,
    lang: "json",
    filename: "package.json",
    note: "The appendix records who needs qs and when tracking began.",
    calloutTarget: "qs@6.11.2",
  },
];

const cleanup: Walkthrough = [
  {
    id: "remove-unused-override",
    title: "Remove an unused override",
    code: "npx pastoralist --remove-unused",
    lang: "bash",
    filename: "Command",
    note: "Here, express has been removed and no dependency needs qs. Scroll to see cleanup.",
  },
  {
    id: "cleanup-result",
    title: "Generated cleanup",
    code: cleanupResult,
    lang: "json",
    filename: "package.json",
    note: "Pastoralist removes the unused override and its appendix entry. Active keep constraints prevent removal.",
    calloutTarget: "overrides",
  },
];

const doctorResult = `{
  "success": true,
  "updated": false,
  "overrideCount": 1,
  "unusedOverrides": [],
  "appliedOverrides": {
    "qs": "6.11.2"
  }
}`;
const hookResult = `{
  "name": "shepherd-cli",
  "scripts": {
    "postinstall": "node --version && pastoralist"
  }
}`;
const workspaceResult = `{
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "@shepherd/api": "qs@^6.10.0",
          "@shepherd/worker": "qs@^6.11.0"
        },
        "ledger": {
          "addedDate": "2026-10-16T00:00:00.000Z"
        }
      }
    }
  }
}`;

const doctor: Walkthrough = [
  {
    id: "doctor-preview",
    title: "Preview tracking",
    code: "npx pastoralist doctor --outputFormat json",
    lang: "bash",
    filename: "Command",
    note: "Preview workspace tracking without changing project files. Security scanning is disabled in this fixture.",
  },
  {
    id: "doctor-result",
    title: "Read the report",
    code: doctorResult,
    lang: "json",
    filename: "stdout (excerpt)",
    note: "The report shows one override and no unused entries. updated is false because this is a preview.",
    calloutTarget: "unusedOverrides",
  },
];

const hook: Walkthrough = [
  {
    id: "setup-postinstall",
    title: "Add the hook",
    code: "npx pastoralist --setup-hook",
    lang: "bash",
    filename: "Command",
    note: "Add Pastoralist after the existing postinstall command.",
  },
  {
    id: "postinstall-result",
    title: "Review the script",
    code: hookResult,
    lang: "json",
    filename: "package.json",
    note: "The existing command runs first, followed by pastoralist.",
    calloutTarget: "postinstall",
  },
];

const workspaces: Walkthrough = [
  {
    id: "scan-workspaces",
    title: "Read workspace dependencies",
    code: 'npx pastoralist --depPaths "packages/*/package.json"',
    lang: "bash",
    filename: "Command",
    note: "The root pins qs. Two workspace packages depend on it: @shepherd/api and @shepherd/worker.",
  },
  {
    id: "workspace-result",
    title: "See both dependents",
    code: workspaceResult,
    lang: "json",
    filename: "package.json (excerpt)",
    note: "Both workspace packages appear in the root appendix.",
    calloutTarget: "@shepherd/api",
  },
];

const ignoredResult = `{
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "@shepherd/api": "qs@^6.10.0"
        },
        "ledger": {
          "addedDate": "2026-10-16T00:00:00.000Z"
        }
      }
    }
  }
}`;
const pathResult = `{
  "name": "shepherd-tool",
  "private": true,
  "devDependencies": {
    "qs": "6.11.2"
  },
  "overrides": {
    "qs": "6.11.2"
  },
  "pastoralist": {
    "appendix": {
      "qs@6.11.2": {
        "dependents": {
          "shepherd-tool": "qs@6.11.2"
        },
        "ledger": {
          "addedDate": "2026-10-16T00:00:00.000Z"
        }
      }
    },
    "security": {
      "enabled": false
    }
  }
}`;
const summaryTable = `+--------------------------+------------+
| 🧑‍🌾 Pastoralist Summary                |
+--------------------------+------------+
| Packages scanned         |          5 |
| Appendix entries updated |          1 |
| Vulnerabilities blocked  |          0 |
| Overrides added          |          0 |
| Overrides removed        |          0 |
| By severity:             |            |
|   Critical               |          0 |
|   High                   |          0 |
|   Medium                 |          0 |
|   Low                    |          0 |
| Write status             | \u001b[32m   Success\u001b[0m |
+--------------------------+------------+`;

const ignore: Walkthrough = [
  {
    id: "filter-workspaces",
    title: "Exclude a workspace",
    code: 'npx pastoralist --depPaths "packages/*/package.json" --ignore "**/worker/**"',
    lang: "bash",
    filename: "Command",
    note: "Scan the workspace manifests while excluding worker.",
  },
  {
    id: "filtered-workspace-result",
    title: "Review the filtered tracking",
    code: ignoredResult,
    lang: "json",
    filename: "package.json (excerpt)",
    note: "Only @shepherd/api contributes dependency context in this run.",
    calloutTarget: "@shepherd/api",
  },
];

const path: Walkthrough = [
  {
    id: "select-manifest",
    title: "Select another manifest",
    code: "npx pastoralist --path standalone/package.json",
    lang: "bash",
    filename: "Command",
    note: "Target the fixture's standalone project with its own qs override.",
  },
  {
    id: "selected-manifest-result",
    title: "Review the selected project",
    code: pathResult,
    lang: "json",
    filename: "standalone/package.json",
    note: "The selected project's appendix records its direct qs dependency.",
    calloutTarget: "qs@6.11.2",
  },
];

const summary: Walkthrough = [
  {
    id: "preview-summary",
    title: "Update tracking with a summary",
    code: "npx pastoralist --summary",
    lang: "bash",
    filename: "Command",
    note: "Update the appendix and print the CLI's metrics. This fixture disables security scanning.",
  },
  {
    id: "summary-result",
    title: "Read the counts",
    code: summaryTable,
    lang: "ansi",
    filename: "stdout",
    note: "The complete generated table. Success means this run wrote the appendix; security scanning was disabled.",
    calloutTarget: "Success",
  },
];

const jsonResult = `{
  "success": true,
  "updated": true,
  "overrideCount": 1,
  "unusedOverrides": [],
  "appliedOverrides": {
    "qs": "6.11.2"
  }
}`;

const dryRun: Walkthrough = [
  {
    id: "preview-changes",
    title: "Preview proposed changes",
    code: "npx pastoralist --dry-run",
    lang: "bash",
    filename: "Command",
    note: "Preview appendix changes for the workspace fixture.",
  },
  {
    id: "dry-run-result",
    title: "Review the proposed appendix",
    code: workspaceResult,
    lang: "json",
    filename: "package.json (preview excerpt)",
    note: "The CLI prints the proposed changes. No project files changed.",
    calloutTarget: "qs@6.11.2",
  },
];

const json: Walkthrough = [
  {
    id: "write-json",
    title: "Write tracking and print JSON",
    code: "npx pastoralist --outputFormat json",
    lang: "bash",
    filename: "Command",
    note: "Update tracking and print a machine-readable result. Security scanning is disabled in this fixture.",
  },
  {
    id: "json-report-result",
    title: "Read the JSON result",
    code: jsonResult,
    lang: "json",
    filename: "stdout (excerpt)",
    note: "This run wrote a new appendix, so updated is true.",
    calloutTarget: "updated",
  },
];

export const walkthroughs = {
  tracking,
  cleanup,
  doctor,
  hook,
  workspaces,
  ignore,
  path,
  summary,
  dryRun,
  json,
};

export function findFrameAnchor(panel: HTMLElement | null | undefined, frame: Frame) {
  if (!panel) return null;
  const target = frame.calloutTarget;
  const lines = Array.from(panel.querySelectorAll<HTMLElement>(".walkthrough-code .line"));
  const line = target ? lines.find((element) => element.textContent?.includes(target)) : lines[0];
  if (!line) return null;
  if (!target) return line;
  const tokens = Array.from(line.querySelectorAll<HTMLElement>("span"));
  const token = tokens.find((element) => element.textContent?.includes(target));
  const anchor = token ?? line;
  return anchor;
}

export function loadFrameHtml(frame: Frame) {
  const fenceMeta = getFrameHighlight(frame);
  const key = JSON.stringify([frame.lang, frame.code, fenceMeta]);
  const cached = highlightedFrames.get(key);
  if (cached) return cached;
  const highlighted = import("@/components/Codeblock")
    .then(({ getHighlighter }) => getHighlighter())
    .then((highlighter) => highlighter.codeToHtml(frame.code, frame.lang, false, fenceMeta));
  highlightedFrames.set(key, highlighted);
  return highlighted;
}

export function selectActiveCallout(currentId: string | null, event: CalloutEvent) {
  const updatesViewport = event.type === "viewport";
  if (!updatesViewport) return currentId;
  const closest = event.candidates.reduce<CalloutCandidate | null>(
    (previous, candidate) => chooseClosestCallout(currentId, previous, candidate),
    null,
  );
  const activeTooltipId = closest?.id ?? null;
  return activeTooltipId;
}

export function getVisibleCallout(
  { id, top, bottom }: CalloutBounds,
  viewportHeight: number,
  minimumVisibleRatio: number,
) {
  if (!id) return null;
  const height = bottom - top;
  const visibleHeight = Math.min(bottom, viewportHeight) - Math.max(top, 0);
  const visibleRatio = visibleHeight / height;
  const eligible = visibleRatio >= minimumVisibleRatio;
  if (!eligible) return null;
  const midpoint = top + height / 2;
  const distance = Math.abs(midpoint - viewportHeight / 2);
  const candidate = { id, distance };
  return candidate;
}

function getFrameHighlight({ code, calloutTarget }: Frame) {
  const target = calloutTarget ?? "";
  const lines = code.split("\n");
  const index = lines.findIndex((line) => line.includes(target));
  const found = index >= 0;
  if (!found) return "";
  const lineNumber = index + 1;
  const meta = `{${lineNumber}}`;
  return meta;
}

function chooseClosestCallout(
  currentId: string | null,
  previous: CalloutCandidate | null,
  candidate: CalloutCandidate,
) {
  const previousDistance = previous?.distance ?? Infinity;
  const closer = candidate.distance < previousDistance;
  const tied = candidate.distance === previousDistance;
  const wasActive = candidate.id === currentId;
  const keepActive = tied && wasActive;
  const selected = closer || keepActive;
  if (selected) return candidate;
  return previous;
}
