# Pastoralist (WIP)

A tool to watch over node module *overrides and resolutions 🐑 👩🏽‍🌾

> *overrides: throughout this repository the key words "overrides" and "resolutions" are used interchangeably as the nomenclature between npm, pnpm, and yarn differs.
## Synopsis

While maintaining a secure `node_module` ecosystem, `package.json` overrides and resolutions assist in ensuring vulnerable dependencies are not installed.

Pastoralist manages node overrides and resolutions so you don't have to.

## How Pastoralist works

Pastoralist manages overrides and resolutions object by, first, creating a reviewable list of overrides and, second, removing unneeded overrides and resolutions items.
### Key notes

1. Pastoralist does **not** manage what is added to overrides and resolutions objects.
2. Pastoralist **does** manage a package that exists in the overrides object
   - Pastoralist will remove overrides and resolutions if they become unneeded according to child `package.json`'s spec.

## Inistall

```sh
npm install pastoralist --save-dev
# pastoralist does not expect to be a dependency! It's a tool
```

## Usage

Pastoralist is built to be used as a CLI program. Run and configure to your liking.
### Basic

```sh
pastoralist <...args to be added>
```

### Advanced

Pastoralist can _and should be incorporated_ into your workflow—which every way is best for you and your team's developer experience! 👌
