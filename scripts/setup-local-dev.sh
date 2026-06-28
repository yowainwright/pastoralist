#!/bin/sh

set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

agent="${PASTORALIST_AGENT_CONFIG:-auto}"
skills="pastoralist,legibility"
hooks="git"
dry_run=0
force=0
explicit_agent=0

usage() {
  echo "Usage: sh scripts/setup-local-dev.sh [--agent auto|codex|claude|all|skip]"
  echo "       sh scripts/setup-local-dev.sh [--skills pastoralist,legibility|all|none]"
  echo "       sh scripts/setup-local-dev.sh [--hooks git,postinstall|none] [--dry-run] [--force]"
}

make_dir() {
  if [ "$dry_run" = "1" ]; then
    echo "Would create $1"
    return
  fi

  mkdir -p "$1"
}

can_write_file() {
  path="$1"

  if [ "$force" = "1" ]; then
    return 0
  fi

  if [ ! -e "$path" ]; then
    return 0
  fi

  grep -q "pastoralist-agent-config" "$path" 2>/dev/null
}

skip_unmanaged() {
  echo "Skipping $1; existing file is unmanaged"
}

write_file() {
  path="$1"

  if ! can_write_file "$path"; then
    skip_unmanaged "$path"
    return 1
  fi

  if [ "$dry_run" = "1" ]; then
    echo "Would write $path"
    return 1
  fi

  return 0
}

write_agents_file() {
  path="AGENTS.md"

  if ! write_file "$path"; then
    return
  fi

  cat > "$path" <<'EOF'
<!-- pastoralist-agent-config -->

# Pastoralist Agent Instructions

## Git Policy

Never run git add, git commit, or git push.
Generate commit messages only.

## Code Style

- Prefer const and immutability.
- Keep functions under 20 lines.
- Use early returns over nested conditionals.
- Hoist complex conditions into named values.
- Hoist complex object values before object creation.
- Keep logic out of JSX.
- Use log() over console.log.
- Prefer unions over enums.
- Avoid comments unless explicitly requested.
- Avoid emojis.

## Async

- Prefer composable async work.
- Use Promise.allSettled for partial failure.
- Always handle stream or subscription cleanup.

## Security

- Never hardcode secrets.
- Validate user input.
- Use parameterized queries.
- Fail securely.

## Commands

- bun run format
- bun run lint
- bun run typecheck-src
- bun run test:unit
- bun run validate

## Task Tracking

Use bd for local persistent task tracking.
EOF
}

write_codex_config() {
  path=".codex/config.toml"

  if ! write_file "$path"; then
    return
  fi

  make_dir ".codex"
  cat > "$path" <<'EOF'
# pastoralist-agent-config
model_reasoning_effort = "xhigh"
EOF
}

write_claude_file() {
  path="CLAUDE.md"

  if ! write_file "$path"; then
    return
  fi

  cat > "$path" <<'EOF'
<!-- pastoralist-agent-config -->

# Pastoralist Agent Instructions

See AGENTS.md for the shared local agent guidance.
EOF
}

install_skill() {
  name="$1"
  source="$2"
  dir=".agents/skills/$name"
  dest="$dir/SKILL.md"
  marker="$dir/.pastoralist-agent-config"

  if [ "$force" != "1" ] && [ -e "$dest" ] && [ ! -e "$marker" ]; then
    skip_unmanaged "$dest"
    return
  fi

  if [ "$dry_run" = "1" ]; then
    echo "Would install $dest"
    return
  fi

  make_dir "$dir"

  if [ -f "$source" ]; then
    cp "$source" "$dest"
  else
    write_skill_fallback "$name" "$dest"
  fi

  printf "%s\n" "pastoralist-agent-config" > "$marker"
}

write_skill_fallback() {
  name="$1"
  dest="$2"

  case "$name" in
    pastoralist)
      write_pastoralist_skill "$dest"
      ;;
    eslint-plugin-legibility)
      write_legibility_skill "$dest"
      ;;
  esac
}

write_pastoralist_skill() {
  dest="$1"

  cat > "$dest" <<'EOF'
---
name: pastoralist
description: >
  Use when setting up, running, or maintaining Pastoralist override tracking,
  security checks, install hooks, GitHub Actions, or dependency override docs.
---

# Pastoralist

Start with `npx pastoralist onboard` when setting up a repo.
Use `npx pastoralist doctor` for read-only project health.
Run `npx -p pastoralist pastoralist-setup-local-dev --dry-run` before setup writes.
Use `npx pastoralist --init` to create config.
Use `npx pastoralist` to update the override appendix.
Use `npx pastoralist --setup-hook` to keep the appendix current after installs.
Use `npx pastoralist --checkSecurity` for advisory checks.
Use `npx pastoralist --remove-unused` only after reviewing dry-run output.

## Agent Setup

Prefer the packaged setup script for agent config and skills:

```bash
npx -p pastoralist pastoralist-setup-local-dev --agent codex --skills all --hooks git,postinstall
```

If only the skill is needed:

```bash
npx -p pastoralist pastoralist-setup-skill
```

## Agent Loop

1. Run `npx pastoralist doctor`.
2. Run `npx -p pastoralist pastoralist-setup-local-dev --dry-run`.
3. Apply the smallest needed setup command.
4. Run `npx pastoralist --dry-run`.
5. Report changed files and remaining manual steps.

For CI, add `yowainwright/pastoralist@v1` to a pull request workflow.
Keep secrets in environment variables, not config files.
EOF
}

write_legibility_skill() {
  dest="$1"

  cat > "$dest" <<'EOF'
---
name: eslint-plugin-legibility
description: >
  Use when checking JavaScript or TypeScript readability with
  eslint-plugin-legibility in this repository.
---

# ESLint Plugin Legibility

Run changed-file legibility checks with npx lint-changed.
Prefer behavior-preserving readability fixes.
Hoist complex conditions, values, and array chains.
Replace repeated scans with Map or Set lookups.
EOF
}

install_pastoralist_skill() {
  source="$script_dir/../skills/pastoralist/SKILL.md"
  install_skill "pastoralist" "$source"
}

install_legibility_skill() {
  source="$script_dir/../node_modules/eslint-plugin-legibility/skills/eslint-plugin-legibility/SKILL.md"
  install_skill "eslint-plugin-legibility" "$source"
}

setup_codex() {
  write_agents_file
  write_codex_config
}

setup_claude() {
  write_claude_file
}

setup_agent() {
  case "$agent" in
    codex)
      setup_codex
      ;;
    claude)
      setup_claude
      ;;
    all)
      setup_codex
      setup_claude
      ;;
    skip)
      ;;
    *)
      echo "Unknown agent: $agent"
      usage
      exit 1
      ;;
  esac
}

has_item() {
  value="$1"
  item="$2"

  case ",$value," in
    *",$item,"*|*,all,*)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

setup_skills() {
  if [ "$skills" = "none" ]; then
    return
  fi

  if has_item "$skills" "pastoralist"; then
    install_pastoralist_skill
  fi

  if has_item "$skills" "legibility"; then
    install_legibility_skill
  fi
}

setup_git_hooks() {
  if ! has_item "$hooks" "git"; then
    return
  fi

  if [ "$dry_run" = "1" ]; then
    echo "Would install git hooks"
    return
  fi

  if [ ! -f "scripts/install-hooks.ts" ]; then
    echo "Skipping git hooks; installer unavailable"
    return
  fi

  if ! command -v bun >/dev/null 2>&1; then
    echo "Skipping git hooks; bun unavailable"
    return
  fi

  bun run scripts/install-hooks.ts
}

setup_postinstall_hook() {
  if ! has_item "$hooks" "postinstall"; then
    return
  fi

  if [ "$dry_run" = "1" ]; then
    echo "Would add Pastoralist postinstall hook"
    return
  fi

  if ! command -v pastoralist >/dev/null 2>&1; then
    echo "Skipping postinstall hook; pastoralist unavailable"
    return
  fi

  pastoralist --setup-hook
}

detect_agent() {
  if [ "$agent" != "auto" ]; then
    return
  fi

  if [ -f "AGENTS.md" ] || [ -d ".codex" ]; then
    agent="codex"
    return
  fi

  if command -v codex >/dev/null 2>&1; then
    agent="codex"
    return
  fi

  if [ -f "CLAUDE.md" ] || [ -d ".claude" ]; then
    agent="claude"
    return
  fi

  if command -v claude >/dev/null 2>&1; then
    agent="claude"
    return
  fi

  agent="codex"
}

confirm_codex() {
  if [ "$explicit_agent" = "1" ]; then
    return
  fi

  if [ "$agent" != "codex" ]; then
    return
  fi

  if [ -f "AGENTS.md" ] && [ -f ".codex/config.toml" ]; then
    return
  fi

  if [ ! -t 0 ]; then
    return
  fi

  printf "Set up local Codex agent config? [Y/n] "
  read answer || answer="n"
  answer=$(printf "%s" "$answer" | tr '[:upper:]' '[:lower:]')

  case "$answer" in
    ""|y|yes)
      return
      ;;
    *)
      echo "Skipping agent config setup"
      agent="skip"
      ;;
  esac
}

read_value() {
  flag="$1"
  shift

  if [ "$#" -eq 0 ]; then
    echo "Missing value for $flag"
    exit 1
  fi

  printf "%s\n" "$1"
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --agent|--target)
      shift
      agent=$(read_value "--agent" "$@")
      explicit_agent=1
      ;;
    --agent=*|--target=*)
      agent="${1#*=}"
      explicit_agent=1
      ;;
    --skills)
      shift
      skills=$(read_value "--skills" "$@")
      ;;
    --skills=*)
      skills="${1#*=}"
      ;;
    --hooks)
      shift
      hooks=$(read_value "--hooks" "$@")
      ;;
    --hooks=*)
      hooks="${1#*=}"
      ;;
    --dry-run)
      dry_run=1
      ;;
    --force)
      force=1
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac

  shift
done

if [ "${CI:-}" = "true" ] || [ "${CI:-}" = "1" ]; then
  echo "CI environment detected, skipping local dev setup"
  exit 0
fi

detect_agent
confirm_codex
setup_agent
setup_skills
setup_git_hooks
setup_postinstall_hook
