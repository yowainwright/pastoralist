import { execFileSync } from "node:child_process";

type ReleaseTag = { tag: string; end: number };
type PublishedTagCheck = (tag: string) => Promise<boolean>;
type ReleaseHistory = {
  history: readonly string[];
  tags: ReadonlyMap<string, readonly string[]>;
  published: PublishedTagCheck;
};

type PullRequest = {
  merge_commit_sha: string | null;
  merged_at: string | null;
  html_url: string;
  base: { ref: string };
  head: { sha: string };
};

type CheckRun = {
  id: number;
  name: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  app: { id: number; slug?: string } | null;
};

type ReviewLookup = {
  pullRequests: (sha: string) => Promise<readonly PullRequest[]>;
  checkRuns: (head: string) => Promise<readonly CheckRun[]>;
};

const MAIN_REF = "refs/remotes/origin/main";
const STABLE_TAG = /^v(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/;
export const SOURCERY_REVIEW_NAME = "Sourcery review";
const SOURCERY_APP_ID = 48477;
const MAX_GIT_OUTPUT = 16 * 1024 * 1024;

export const checkRelease = async (lookup: ReviewLookup) => {
  const [candidate] = gitLines(["rev-parse", "HEAD"]);
  const history = gitLines(["rev-list", "--first-parent", MAIN_REF]);
  const tags = stableTagsByCommit();
  const { baseline, commits } = await findReleaseRange(candidate, {
    history,
    tags,
    published: isPublished,
  });
  const reviews = await Array.fromAsync(commits, (sha) => reviewCommit(sha, lookup));
  const report = { baseline, reviews };
  return report;
};

export const findReleaseRange = async (
  candidate: string,
  { history, tags, published }: ReleaseHistory,
) => {
  const start = history.indexOf(candidate);
  if (start === -1) throw new Error(`${candidate} is outside main's first-parent history`);
  const olderCommits = history.slice(start + 1);
  const candidates = olderCommits.flatMap((commit, index) => {
    const versions = tags.get(commit) ?? [];
    const end = start + index + 1;
    const entries = releaseTagEntries(versions, end);
    return entries;
  });
  const { tag: baseline, end } = await findPublishedTag(candidates, published);
  const commits = history.slice(start, end).toReversed();
  const range = { baseline, commits };
  return range;
};

export const reviewCommit = async (sha: string, { pullRequests, checkRuns }: ReviewLookup) => {
  const associated = await pullRequests(sha);
  const matches = associated.filter((pr) => {
    const matchesMerge = pr.merge_commit_sha === sha && pr.base.ref === "main";
    const merged = Boolean(pr.merged_at) && matchesMerge;
    return merged;
  });
  if (matches.length !== 1) {
    const missing = matches.length === 0;
    const conclusion = missing ? "no merged PR into main" : "ambiguous merged PRs";
    const unmatched = { sha, conclusion };
    return unmatched;
  }
  const [pr] = matches;
  const checks = await checkRuns(pr.head.sha);
  const conclusion = reviewConclusion(checks, pr.head.sha);
  const { html_url: pullUrl } = pr;
  const review = { sha, pullUrl, conclusion };
  return review;
};

const stableTagsByCommit = () => {
  const refs = gitLines([
    "for-each-ref",
    "--sort=-version:refname",
    "--format=%(refname:strip=2) %(objectname) %(*objectname)",
    "refs/tags",
  ]);
  const tags = new Map<string, string[]>();
  for (const ref of refs) {
    const [tag, object, peeled] = ref.split(" ");
    if (!STABLE_TAG.test(tag)) continue;
    const commit = peeled || object;
    const versions = tags.get(commit) ?? [];
    tags.set(commit, versions.concat(tag));
  }
  return tags;
};

const gitLines = (args: readonly string[]) => {
  const encoding = "utf8" as const;
  const options = { encoding, maxBuffer: MAX_GIT_OUTPUT };
  const output = execFileSync("git", args, options).trim();
  const lines = output ? output.split("\n") : [];
  return lines;
};

const isPublished: PublishedTagCheck = async (tag) => {
  const version = tag.slice(1);
  const signal = AbortSignal.timeout(15000);
  const response = await fetch(`https://registry.npmjs.org/pastoralist/${version}`, { signal });
  if (response.status === 404) return false;
  if (!response.ok) throw new Error(`npm returned HTTP ${response.status} for ${tag}`);
  const metadata: { version?: unknown } = await response.json();
  if (metadata.version !== version)
    throw new Error(`npm returned an unexpected version for ${tag}`);
  return true;
};

const releaseTagEntries = (versions: readonly string[], end: number) => {
  const entries = versions.map((tag) => ({ tag, end }));
  return entries;
};

const findPublishedTag = async (
  candidates: readonly ReleaseTag[],
  published: PublishedTagCheck,
  position = 0,
): Promise<ReleaseTag> => {
  const entry = candidates[position];
  if (!entry) throw new Error("No earlier stable npm release tag found on main");
  if (await published(entry.tag)) return entry;
  const next = findPublishedTag(candidates, published, position + 1);
  return next;
};

const reviewConclusion = (checks: readonly CheckRun[], head: string) => {
  const matching = checks.filter((check) => isSourceryCheck(check, head));
  const [latest, previous] = matching.toSorted((left, right) => right.id - left.id);
  if (!latest) return "missing";
  if (latest.id === previous?.id) return "ambiguous check runs";
  const { status } = latest;
  if (status !== "completed") {
    const incomplete = `not completed (${status})`;
    return incomplete;
  }
  const conclusion = latest.conclusion ?? "missing conclusion";
  return conclusion;
};

const isSourceryCheck = (check: CheckRun, head: string) => {
  const matchesCheck = check.name === SOURCERY_REVIEW_NAME && check.head_sha === head;
  const matchesApp = check.app?.id === SOURCERY_APP_ID && check.app.slug === "sourcery-ai";
  const isSourcery = matchesCheck && matchesApp;
  return isSourcery;
};
