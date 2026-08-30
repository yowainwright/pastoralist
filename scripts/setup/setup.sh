#!/bin/sh

set -eu

case "$0" in
*/*)
	script_path=${0%/*}
	;;
*)
	script_path=.
	;;
esac

start_dir=$PWD
cd "$script_path"
script_dir=$PWD
cd "$start_dir"
agent="${PASTORALIST_AGENT_CONFIG:-auto}"
skills="pastoralist,legibility"
hooks="git"
dry_run=0
force=0
explicit_agent=0
node_modules_dir="$script_dir/../../node_modules"
legibility_package_dir="$node_modules_dir/eslint-plugin-legibility"
pastoralist_skill_source="$script_dir/../../skills/pastoralist/SKILL.md"
legibility_skill_source="$legibility_package_dir/skills/eslint-plugin-legibility/SKILL.md"

usage() {
	echo "Usage: sh scripts/setup/setup.sh [bootstrap|prepare|agent-config|local-dev|skill]"
	echo "       sh scripts/setup/setup.sh local-dev [--agent auto|codex|claude|all|skip] [--skills pastoralist,legibility|all|none]"
	echo "       sh scripts/setup/setup.sh local-dev [--hooks git,postinstall|none] [--dry-run] [--force]"
}

has_item() {
	value="$1"
	item="$2"

	case ",$value," in
	*",$item,"* | *,all,*)
		return 0
		;;
	*)
		return 1
		;;
	esac
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

write_file() {
	path="$1"

	if ! can_write_file "$path"; then
		echo "Skipping $path; existing file is unmanaged"
		return 1
	fi

	if [ "$dry_run" = "1" ]; then
		echo "Would write $path"
		return 1
	fi

	return 0
}

write_agents_file() {
	if ! write_file "AGENTS.md"; then
		return
	fi

	cat >AGENTS.md <<'EOF'
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

## Commands

- pnpm run format
- pnpm run lint
- pnpm run typecheck-src
- pnpm run test:unit
- pnpm run validate
EOF
}

write_codex_config() {
	if ! write_file ".codex/config.toml"; then
		return
	fi

	mkdir -p .codex
	cat >.codex/config.toml <<'EOF'
# pastoralist-agent-config
model_reasoning_effort = "xhigh"
EOF
}

write_claude_file() {
	if ! write_file "CLAUDE.md"; then
		return
	fi

	cat >CLAUDE.md <<'EOF'
<!-- pastoralist-agent-config -->

# Pastoralist Agent Instructions

See AGENTS.md for the shared local agent guidance.
EOF
}

write_legibility_skill() {
	dest="$1"

	cat >"$dest" <<'EOF'
---
name: eslint-plugin-legibility
description: Check JS/TS readability with eslint-plugin-legibility.
---

# ESLint Plugin Legibility

Run the repository lint command first. Prefer small readability fixes.
EOF
}

can_write_skill() {
	dest="$1"
	marker="$2"

	if [ "$force" = "1" ]; then
		return 0
	fi

	if [ ! -e "$dest" ]; then
		return 0
	fi

	[ -e "$marker" ]
}

install_skill() {
	name="$1"
	source="$2"
	dir=".agents/skills/$name"
	dest="$dir/SKILL.md"
	marker="$dir/.pastoralist-agent-config"

	if ! can_write_skill "$dest" "$marker"; then
		echo "Skipping $dest; existing file is unmanaged"
		return
	fi

	if [ "$dry_run" = "1" ]; then
		echo "Would install $dest"
		return
	fi

	mkdir -p "$dir"

	if [ -f "$source" ]; then
		cp "$source" "$dest"
	elif [ "$name" = "eslint-plugin-legibility" ]; then
		write_legibility_skill "$dest"
	else
		echo "Missing skill source: $source" >&2
		exit 1
	fi

	printf "%s\n" "pastoralist-agent-config" >"$marker"
}

has_codex_context() {
	if [ -f "AGENTS.md" ]; then
		return 0
	fi

	if [ -d ".codex" ]; then
		return 0
	fi

	command -v codex >/dev/null 2>&1
}

has_claude_context() {
	if [ -f "CLAUDE.md" ]; then
		return 0
	fi

	if [ -d ".claude" ]; then
		return 0
	fi

	command -v claude >/dev/null 2>&1
}

detect_agent() {
	if [ "$agent" != "auto" ]; then
		return
	fi

	if has_codex_context; then
		agent="codex"
		return
	fi

	if has_claude_context; then
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

	if has_codex_files; then
		return
	fi

	if [ ! -t 0 ]; then
		return
	fi

	printf "Set up local Codex agent config [Y/n] "
	if ! read answer; then
		answer="n"
	fi

	case "$answer" in
	"" | y | Y | yes | YES | Yes)
		return
		;;
	*)
		echo "Skipping agent config setup"
		agent="skip"
		;;
	esac
}

has_codex_files() {
	if [ ! -f "AGENTS.md" ]; then
		return 1
	fi

	[ -f ".codex/config.toml" ]
}

is_ci() {
	if [ "${CI:-}" = "true" ]; then
		return 0
	fi

	[ "${CI:-}" = "1" ]
}

setup_agent() {
	case "$agent" in
	codex)
		write_agents_file
		write_codex_config
		;;
	claude)
		write_claude_file
		;;
	all)
		write_agents_file
		write_codex_config
		write_claude_file
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

setup_skills() {
	if [ "$skills" = "none" ]; then
		return
	fi

	if has_item "$skills" "pastoralist"; then
		install_skill "pastoralist" "$pastoralist_skill_source"
	fi

	if has_item "$skills" "legibility"; then
		install_skill "eslint-plugin-legibility" "$legibility_skill_source"
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

	if ! command -v pnpm >/dev/null 2>&1; then
		echo "Skipping git hooks; pnpm unavailable"
		return
	fi

	if [ ! -f "scripts/setup/install-hooks.ts" ]; then
		echo "Skipping git hooks; installer unavailable"
		return
	fi

	pnpm exec jiti scripts/setup/install-hooks.ts
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

run_bootstrap() {
	pnpm install
	pnpm --dir app install
	pnpm run build
	pnpm run test:unit
	echo "Setup complete. Run pnpm run dev:link to use pastoralist globally."
}

run_prepare() {
	if is_ci; then
		echo "CI environment detected, skipping git hooks installation"
		exit 0
	fi

	setup_git_hooks
	skills="legibility"
	hooks="none"
	run_local_dev
}

run_local_dev() {
	if is_ci; then
		echo "CI environment detected, skipping local dev setup"
		exit 0
	fi

	detect_agent
	confirm_codex
	setup_agent
	setup_skills
	setup_git_hooks
	setup_postinstall_hook
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

command="local-dev"
script_name=${0##*/}

case "$script_name" in
pastoralist-setup-skill)
	command="skill"
	;;
pastoralist-setup-local-dev)
	command="local-dev"
	;;
*)
	if [ "$#" -gt 0 ]; then
		case "$1" in
		bootstrap | prepare | agent-config | local-dev | skill)
			command="$1"
			shift
			;;
		esac
	fi
	;;
esac

case "$command" in
agent-config)
	skills="legibility"
	hooks="none"
	;;
skill)
	agent="skip"
	skills="pastoralist"
	hooks="none"
	;;
esac

while [ "$#" -gt 0 ]; do
	case "$1" in
	--agent | --target)
		shift
		agent=$(read_value "--agent" "$@")
		explicit_agent=1
		;;
	--skills)
		shift
		skills=$(read_value "--skills" "$@")
		;;
	--hooks)
		shift
		hooks=$(read_value "--hooks" "$@")
		;;
	--dry-run)
		dry_run=1
		;;
	--force)
		force=1
		;;
	--help | -h)
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

case "$command" in
bootstrap)
	run_bootstrap
	;;
prepare)
	run_prepare
	;;
agent-config | local-dev | skill)
	run_local_dev
	;;
*)
	echo "Unknown setup command: $command"
	usage
	exit 1
	;;
esac
