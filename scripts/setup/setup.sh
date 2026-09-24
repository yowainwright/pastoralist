#!/bin/sh

set -eu

is_pastoralist_missing() {
	! command -v pastoralist >/dev/null 2>&1
}

is_hook_installer_missing() {
	[ ! -f "scripts/setup/install-hooks.ts" ]
}

is_pnpm_missing() {
	! command -v pnpm >/dev/null 2>&1
}

is_unmanaged_skill() {
	! can_write_skill "$dest" "$marker"
}

is_unmanaged_file() {
	! can_write_file "$path"
}

resolve_script_dir() {
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
}

resolve_script_dir
agent="${PASTORALIST_AGENT_CONFIG:-auto}"
skills="pastoralist,legibility"
hooks="git"
dry_run=0
force=0
explicit_agent=0
node_modules_dir="$script_dir/../../node_modules"
legibility_package_dir="$node_modules_dir/oxlint-plugin-legibility"
pastoralist_skill_source="$script_dir/../../skills/pastoralist/SKILL.md"
legibility_skill_source="$legibility_package_dir/skills/oxlint-plugin-legibility/SKILL.md"

usage() {
	echo "Usage: sh scripts/setup/setup.sh [bootstrap|prepare|agent-config|local-dev|skill]"
	echo "       sh scripts/setup/setup.sh local-dev [--agent auto|codex|claude|all|skip] [--skills pastoralist,legibility|all|none]"
	echo "       sh scripts/setup/setup.sh local-dev [--hooks git,postinstall|none] [--dry-run] [--force]"
}

has_item() {
	value="${1?Missing item list}"
	item="${2?Missing item}"

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
	path="${1?Missing path}"

	if [ "$force" = "1" ]; then
		return 0
	fi

	[ -e "$path" ] || return 0

	grep -q "pastoralist-agent-config" "$path" 2>/dev/null
}

write_file() {
	path="${1?Missing path}"

	if is_unmanaged_file; then
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
	write_file "AGENTS.md" || return 0

	cat >AGENTS.md <<'EOF'
<!-- pastoralist-agent-config -->

# Pastoralist Agent Instructions

## Git Policy

Never run git add, git commit, or git push.
Generate commit messages only.

## Change Approval

Ask before writing files. Reading files and running checks is fine.

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
	write_file ".codex/config.toml" || return 0

	mkdir -p .codex
	cat >.codex/config.toml <<'EOF'
# pastoralist-agent-config
model_reasoning_effort = "xhigh"
EOF
}

write_claude_file() {
	write_file "CLAUDE.md" || return 0

	cat >CLAUDE.md <<'EOF'
<!-- pastoralist-agent-config -->

# Pastoralist Agent Instructions

See AGENTS.md for the shared local agent guidance.
EOF
}

write_legibility_skill() {
	dest="${1?Missing destination}"

	cat >"$dest" <<'EOF'
---
name: oxlint-plugin-legibility
description: Check JS/TS readability with oxlint-plugin-legibility.
---

# Oxlint Plugin Legibility

Run the repository lint command first. Prefer small readability fixes.
EOF
}

can_write_skill() {
	dest="${1?Missing destination}"
	marker="${2?Missing marker}"

	if [ "$force" = "1" ]; then
		return 0
	fi

	[ -e "$dest" ] || return 0

	[ -e "$marker" ]
}

write_skill_files() {
	mkdir -p "$dir"
	if [ -f "$source" ]; then
		cp "$source" "$dest"
	elif [ "$name" = "oxlint-plugin-legibility" ]; then
		write_legibility_skill "$dest"
	else
		echo "Missing skill source: $source" >&2
		exit 1
	fi

	printf "%s\n" "pastoralist-agent-config" >"$marker"
}

install_skill() {
	name="${1?Missing skill name}"
	source="${2?Missing skill source}"
	dir=".agents/skills/$name"
	dest="$dir/SKILL.md"
	marker="$dir/.pastoralist-agent-config"

	if is_unmanaged_skill; then
		echo "Skipping $dest; existing file is unmanaged"
		return
	fi
	if [ "$dry_run" = "1" ]; then
		echo "Would install $dest"
		return
	fi
	write_skill_files
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
	[ -t 0 ] || return 0
	prompt_codex
}

prompt_codex() {
	printf "Set up local Codex agent config [Y/n] "
	read -r answer || answer="n"

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
	[ -f "AGENTS.md" ] || return 1

	[ -f ".codex/config.toml" ]
}

is_ci() {
	if [ "${CI:-}" = "true" ]; then
		return 0
	fi

	[ "${CI:-}" = "1" ]
}

setup_codex() {
	write_agents_file
	write_codex_config
}

fail_usage() {
	echo "${1?Missing error message}"
	usage
	exit 1
}

setup_agent() {
	case "$agent" in
	codex)
		setup_codex
		;;
	claude)
		write_claude_file
		;;
	all)
		setup_codex
		write_claude_file
		;;
	skip)
		;;
	*)
		fail_usage "Unknown agent: $agent"
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
		install_skill "oxlint-plugin-legibility" "$legibility_skill_source"
	fi
}

setup_git_hooks() {
	has_item "$hooks" "git" || return 0

	if [ "$dry_run" = "1" ]; then
		echo "Would install git hooks"
		return
	fi
	install_git_hooks
}

install_git_hooks() {
	if is_pnpm_missing; then
		echo "Skipping git hooks; pnpm unavailable"
		return
	fi

	if is_hook_installer_missing; then
		echo "Skipping git hooks; installer unavailable"
		return
	fi

	pnpm exec jiti scripts/setup/install-hooks.ts
}

setup_postinstall_hook() {
	has_item "$hooks" "postinstall" || return 0

	if [ "$dry_run" = "1" ]; then
		echo "Would add Pastoralist postinstall hook"
		return
	fi

	if is_pastoralist_missing; then
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
	flag="${1?Missing flag}"
	shift
	case "$flag" in
	--target) flag="--agent" ;;
	esac

	if [ "$#" -eq 0 ]; then
		echo "Missing value for $flag"
		exit 1
	fi

	printf "%s\n" "$1"
}

set_value_option() {
	case "${1?Missing option}" in
	--agent | --target)
		agent="${2?Missing agent}"
		explicit_agent=1
		;;
	--skills)
		skills="${2?Missing skills}"
		;;
	--hooks)
		hooks="${2?Missing hooks}"
		;;
	esac
}

set_flag() {
	case "${1?Missing flag}" in
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
		fail_usage "Unknown option: $1"
		;;
	esac
}

parse_options() {
	while [ "$#" -gt 0 ]; do
		option="${1?Missing option}"
		shift
		case "$option" in
		--agent | --target | --skills | --hooks)
			option_value=$(read_value "$option" "$@")
			set_value_option "$option" "$option_value"
			shift
			;;
		*)
			set_flag "$option"
			;;
		esac
	done
}

is_setup_command() {
	case "${1:-}" in
	bootstrap | prepare | agent-config | local-dev | skill)
		return 0
		;;
	*) return 1 ;;
	esac
}

set_command_defaults() {
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
}

run_command() {
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
		fail_usage "Unknown setup command: $command"
		;;
	esac
}

main() {
	command="local-dev"
	if is_setup_command "${1:-}"; then
		command="${1?Missing command}"
		shift
	fi
	set_command_defaults
	parse_options "$@"
	run_command
}

main "$@"
