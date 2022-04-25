# Pastoralist

A tool to watch over npm, pnpm, or yarn overrides/resolutions 🐑 👩🏽‍🌾

## Synopsis

When maintaining a secure node module ecosystem, npm/pnpm overrides or yarn resolutions can assist in ensuring vulnerable dependencies are not installed.
Pastoralist manages overrides/resolutions so you don't have to.

## How Pastoralist works

Pastoralist manages the overrides/resolutions object by running `pastoralize init` or `pastoralize check` scripts when specified within a project.
### Key notes

1. Pastoralist does **not** manage what is added to an overrides/resolutions object.
2. Pastoralist **does** manage a package that exists in the overrides/resolutions object.

### Init

When `pastoralize init` is run, Pastoralist reads an overrides/resolutions object and creates an object.<br>
The object includes the overrides with their dependendents nested in them:

```
"immer": {
  version: "@todo",
  dependendents: {
    "react": "@todo"
  }
}
```

### Check

When `pastoralize check` is run
