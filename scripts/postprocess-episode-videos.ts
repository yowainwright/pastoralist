import { mkdir, readdir, readFile, rename } from "node:fs/promises";
import { basename, dirname, join } from "node:path";

type MediaInfo = {
  duration: number;
  width: number;
  height: number;
};

type CastEvent = {
  time: number;
  output: string;
};

type Highlight = {
  time: number;
  row: number;
  col: number;
  rows: number;
  cols: number;
  score: number;
  color: "blue" | "amber" | "green";
  text: string;
};

const DEFAULT_EPISODES_DIR = "app/public/episodes";
const DEFAULT_SPEED = 1.25;
const MAX_HIGHLIGHTS = 10;
const MIN_HIGHLIGHT_GAP_SECONDS = 1.1;

const COLORS: Record<Highlight["color"], string> = {
  amber: "0xFACC15",
  blue: "0x60A5FA",
  green: "0x22C55E",
};

const args = parseArgs(Bun.argv.slice(2));
const episodesDir = args.episodesDir ?? DEFAULT_EPISODES_DIR;
const speed = Number(args.speed ?? DEFAULT_SPEED);
const onlyEpisode = args.episode;
const dryRun = args.dryRun === "true";

if (!Number.isFinite(speed) || speed <= 0 || speed > 2) {
  throw new Error("--speed must be a positive number up to 2.");
}

const episodeDirs = (await readdir(episodesDir, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(episodesDir, entry.name))
  .filter((dir) => onlyEpisode === undefined || basename(dir) === onlyEpisode)
  .sort();

if (episodeDirs.length === 0) {
  throw new Error(`No episodes found in ${episodesDir}.`);
}

for (const episodeDir of episodeDirs) {
  await postprocessEpisode(episodeDir);
}

async function postprocessEpisode(episodeDir: string): Promise<void> {
  const slug = basename(episodeDir);
  const castPath = join(episodeDir, "demo.cast");
  const demoPath = join(episodeDir, "demo.mp4");
  const voicePath = join(episodeDir, "voice.mp3");
  const outputPath = join(episodeDir, "final.mp4");
  const tmpPath = join(dirname(outputPath), `.final.${process.pid}.tmp.mp4`);

  const video = await readMediaInfo(demoPath);
  const voice = await readMediaInfo(voicePath);
  const cast = await readCast(castPath);
  const highlights = selectHighlights(
    detectHighlights(cast, video, voice.duration),
  );

  if (highlights.length === 0) {
    console.log(
      `${slug}: no highlight candidates found; rebuilding with speed only`,
    );
  } else {
    console.log(
      `${slug}: ${highlights.length} highlights, ${voice.duration.toFixed(2)}s -> ${(
        voice.duration / speed
      ).toFixed(2)}s`,
    );
  }

  if (dryRun) {
    for (const highlight of highlights) {
      console.log(
        `  ${highlight.time.toFixed(2)}s ${highlight.color} row ${highlight.row + 1}: ${highlight.text}`,
      );
    }
    return;
  }

  await mkdir(dirname(tmpPath), { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-i",
    demoPath,
    "-i",
    voicePath,
    "-filter_complex",
    buildFilter(video, voice.duration, highlights),
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-t",
    formatSeconds(voice.duration / speed),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-ar",
    "48000",
    "-movflags",
    "faststart",
    "-shortest",
    tmpPath,
  ]);
  await rename(tmpPath, outputPath);
}

function buildFilter(
  video: MediaInfo,
  voiceDuration: number,
  highlights: Highlight[],
): string {
  const parts: string[] = [
    `[0:v]tpad=stop_mode=clone:stop_duration=${formatSeconds(voiceDuration)},trim=duration=${formatSeconds(
      voiceDuration,
    )},fps=15[base]`,
  ];
  let previous = "base";

  highlights.forEach((highlight, index) => {
    const box = toPixelBox(highlight, video);
    const color = COLORS[highlight.color];
    const alpha = highlight.color === "green" ? 0.24 : 0.22;
    const start = Math.max(0, highlight.time - 0.1);
    const duration = highlight.rows > 2 ? 2.2 : 1.7;
    const end = Math.min(voiceDuration, start + duration);
    const source = `h${index}`;
    const next = `v${index}`;

    parts.push(
      `color=c=${color}@${alpha}:s=${box.width}x${box.height}:d=${formatSeconds(
        voiceDuration,
      )},format=rgba,drawbox=x=0:y=0:w=iw:h=ih:color=${color}@0.95:t=2,fade=t=in:st=${formatSeconds(
        start,
      )}:d=0.25:alpha=1,fade=t=out:st=${formatSeconds(end)}:d=0.25:alpha=1[${source}]`,
    );
    parts.push(
      `[${previous}][${source}]overlay=x=${box.x}:y=${box.y}:eof_action=pass[${next}]`,
    );
    previous = next;
  });

  parts.push(`[${previous}]setpts=PTS/${speed}[v]`);
  parts.push(`[1:a]atempo=${speed}[a]`);
  return parts.join(";");
}

function detectHighlights(
  cast: CastEvent[],
  video: MediaInfo,
  voiceDuration: number,
): Highlight[] {
  const rows = 24;
  const cols = 80;
  const terminal = createTerminal(rows, cols);
  const seen = new Set<string>();
  const highlights: Highlight[] = [];

  for (const event of cast) {
    terminal.write(event.output);
    if (event.time <= 0.2 || event.time >= voiceDuration - 0.3) {
      continue;
    }

    const lines = terminal.lines();
    for (let row = 0; row < lines.length; row += 1) {
      const line = lines[row];
      const scored = scoreLine(line);
      if (scored.score < 7) {
        continue;
      }

      const box = lineBox(lines, row, scored.score);
      const signature = `${scored.color}:${normalizeText(line)}`;
      if (seen.has(signature)) {
        continue;
      }

      seen.add(signature);
      highlights.push({
        time: event.time,
        row,
        col: box.col,
        rows: box.rows,
        cols: box.cols,
        score: scored.score,
        color: scored.color,
        text: normalizeText(line),
      });
    }
  }

  return highlights.filter((highlight) => {
    const pixelBox = toPixelBox(highlight, video);
    return pixelBox.width >= 40 && pixelBox.height >= 16;
  });
}

function selectHighlights(highlights: Highlight[]): Highlight[] {
  const groups: Highlight[] = [];

  for (const highlight of highlights.sort((a, b) => a.time - b.time)) {
    const last = groups.at(-1);
    if (
      last === undefined ||
      highlight.time - last.time >= MIN_HIGHLIGHT_GAP_SECONDS
    ) {
      groups.push(highlight);
    } else if (highlight.score > last.score) {
      groups[groups.length - 1] = highlight;
    }
  }

  if (groups.length <= MAX_HIGHLIGHTS) {
    return groups;
  }

  const first = groups[0];
  const last = groups.at(-1);
  const middle = groups
    .slice(1, -1)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_HIGHLIGHTS - 2);

  return [first, ...middle, last].sort((a, b) => a.time - b.time);
}

function scoreLine(line: string): { score: number; color: Highlight["color"] } {
  const text = normalizeText(line);
  let score = 0;
  let color: Highlight["color"] = "blue";

  if (text.length < 4 || /^[┌└├│─+\-\s]+$/.test(text)) {
    return { score: 0, color };
  }

  if (/(DRY RUN|Would write|Previewing)/i.test(text)) {
    score += 8;
    color = "amber";
  }
  if (
    /("overrides"|"resolutions"|"pnpm\.overrides"|override|overrides)/i.test(
      text,
    )
  ) {
    score += 8;
  }
  if (
    /(appendix|ledger|security|vulnerab|CVE|severity|patchedVersion)/i.test(
      text,
    )
  ) {
    score += 7;
  }
  if (
    /(workspace|monorepo|package|dependencies|dependents|sandbox|setup|hook|provider|socket|osv|json|debug|quiet|patch|auto.?fix)/i.test(
      text,
    )
  ) {
    score += 4;
  }
  if (
    /(postinstall|setup hook|scripts before|scripts after|already configured|dry-run)/i.test(
      text,
    )
  ) {
    score += 7;
  }
  if (
    /(removed|added|updated|blocked|success|safe|cleaned|tracked|scanned|write status|summary)/i.test(
      text,
    )
  ) {
    score += 6;
    if (/(success|safe|write status|removed|cleaned)/i.test(text)) {
      color = "green";
    }
  }

  return { score, color };
}

function lineBox(
  lines: string[],
  row: number,
  score: number,
): { col: number; rows: number; cols: number } {
  const startCol = Math.max(0, lines[row].search(/\S/));
  let endRow = row;

  if (
    /("overrides"|"resolutions"|"pnpm\.overrides"|Cleaned up|Summary|Would write|package\.json)/i.test(
      lines[row],
    )
  ) {
    const maxRows = score >= 14 ? 7 : 4;
    for (
      let index = row + 1;
      index < Math.min(lines.length, row + maxRows);
      index += 1
    ) {
      const text = lines[index].trimEnd();
      if (text.trim().length === 0) {
        break;
      }
      endRow = index;
    }
  }

  const selected = lines.slice(row, endRow + 1);
  const maxEndCol = selected.reduce(
    (max, line) => Math.max(max, line.trimEnd().length),
    startCol + 1,
  );
  return {
    col: startCol,
    rows: endRow - row + 1,
    cols: Math.max(1, maxEndCol - startCol),
  };
}

function toPixelBox(
  highlight: Highlight,
  video: MediaInfo,
): { x: number; y: number; width: number; height: number } {
  const cellWidth = video.width / 80;
  const cellHeight = video.height / 24;
  const x = clamp(
    Math.floor(highlight.col * cellWidth) - 4,
    0,
    video.width - 2,
  );
  const y = clamp(
    Math.floor(highlight.row * cellHeight) + 2,
    0,
    video.height - 2,
  );
  const width = clamp(
    Math.ceil(highlight.cols * cellWidth) + 10,
    32,
    video.width - x,
  );
  const height = clamp(
    Math.ceil(highlight.rows * cellHeight) - 2,
    18,
    video.height - y,
  );
  return { x, y, width, height };
}

async function readCast(path: string): Promise<CastEvent[]> {
  const content = await readFile(path, "utf8");
  const lines = content.split("\n").filter(Boolean);
  const events: CastEvent[] = [];
  let time = 0;

  for (const line of lines.slice(1)) {
    const parsed = JSON.parse(line) as [number, string, string];
    if (parsed[1] !== "o") {
      continue;
    }
    time = parsed[0];
    events.push({ time, output: parsed[2] });
  }

  return events;
}

async function readMediaInfo(path: string): Promise<MediaInfo> {
  const result = await run("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=width,height",
    "-select_streams",
    "v:0",
    "-of",
    "json",
    path,
  ]);
  const parsed = JSON.parse(result.stdout) as {
    format?: { duration?: string };
    streams?: Array<{ width?: number; height?: number }>;
  };
  const duration = Number(parsed.format?.duration);
  const stream = parsed.streams?.[0];

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Unable to read duration for ${path}.`);
  }

  return {
    duration,
    width: stream?.width ?? 0,
    height: stream?.height ?? 0,
  };
}

function createTerminal(
  rows: number,
  cols: number,
): { write: (text: string) => void; lines: () => string[] } {
  const screen = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => " "),
  );
  let row = 0;
  let col = 0;

  const scroll = (): void => {
    screen.shift();
    screen.push(Array.from({ length: cols }, () => " "));
    row = rows - 1;
  };

  const put = (char: string): void => {
    if (col >= cols) {
      col = 0;
      row += 1;
    }
    if (row >= rows) {
      scroll();
    }
    screen[row][col] = char;
    col += 1;
  };

  return {
    write: (text: string): void => {
      for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (char === "\x1b") {
          const next = parseEscapeSequence(
            text,
            index,
            screen,
            rows,
            cols,
            row,
            col,
          );
          index = next.index;
          row = next.row;
          col = next.col;
          continue;
        }
        if (char === "\r") {
          col = 0;
          continue;
        }
        if (char === "\n") {
          col = 0;
          row += 1;
          if (row >= rows) {
            scroll();
          }
          continue;
        }
        if (char === "\b") {
          col = Math.max(0, col - 1);
          continue;
        }
        if (char >= " ") {
          put(char);
        }
      }
    },
    lines: (): string[] => screen.map((line) => line.join("").trimEnd()),
  };
}

function parseEscapeSequence(
  text: string,
  start: number,
  screen: string[][],
  rows: number,
  cols: number,
  row: number,
  col: number,
): { index: number; row: number; col: number } {
  let index = start + 1;
  if (text[index] !== "[") {
    return { index, row, col };
  }
  index += 1;

  let paramStr = "";
  while (index < text.length && !/[A-Za-z~]/.test(text[index])) {
    paramStr += text[index];
    index += 1;
  }

  const params = paramStr
    .split(";")
    .map((p) => (p === "" ? 1 : parseInt(p, 10)));
  const n = params[0] ?? 1;
  const cmd = text[index];

  if (cmd === "A") return { index, row: clamp(row - n, 0, rows - 1), col };
  if (cmd === "B") return { index, row: clamp(row + n, 0, rows - 1), col };
  if (cmd === "C") return { index, row, col: clamp(col + n, 0, cols - 1) };
  if (cmd === "D") return { index, row, col: clamp(col - n, 0, cols - 1) };
  if (cmd === "H") {
    return {
      index,
      row: clamp((params[0] ?? 1) - 1, 0, rows - 1),
      col: clamp((params[1] ?? 1) - 1, 0, cols - 1),
    };
  }
  if (cmd === "J" && n === 2) {
    screen.forEach((line) => line.fill(" "));
    return { index, row: 0, col: 0 };
  }
  if (cmd === "K") {
    const line = screen[row];
    for (let cursor = col; cursor < line.length; cursor += 1) {
      line[cursor] = " ";
    }
  }

  return { index, row, col };
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatSeconds(value: number): string {
  return Number(value.toFixed(3)).toString();
}

function parseArgs(values: string[]): Record<string, string | undefined> {
  const parsed: Record<string, string | undefined> = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }
    const key = value.slice(2);
    const next = values[index + 1];
    if (next === undefined || next.startsWith("--")) {
      parsed[key] = "true";
    } else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

async function run(
  command: string,
  args: string[],
): Promise<{ stdout: string; stderr: string }> {
  const proc = Bun.spawn([command, ...args], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (code !== 0) {
    throw new Error(
      `${command} ${args.join(" ")} failed with ${code}\n${stderr}`,
    );
  }

  return { stdout, stderr };
}
