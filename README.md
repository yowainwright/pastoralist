# Pastoralist (WIP)

A tool to watch over npm, pnpm, or yarn \*overrides 🐑 👩🏽‍🌾

## Synopsis

When maintaining a secure `node_module` ecosystem, npm, pnpm overrides or yarn overrides (resolutions) can assist in ensuring vulnerable dependencies are not installed.

Pastoralist manages overrides so you don't have to.

## How Pastoralist works

Pastoralist manages the overrides object by, first, creating a reviewable list of overrides and, second, removing any unneeded override items.
### Key notes

1. Pastoralist does **not** manage what is added to an overrides object.
2. Pastoralist **does** manage a package that exists in the overrides object.

### Init

When `pastoralize` is run, Pastoralist reads an overrides object and creates an object.<br>
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
