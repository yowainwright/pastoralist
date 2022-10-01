# [Pastoralist](https://jeffry.in/pastoralist/)

![Typed with TypeScript](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)
[![npm version](https://badge.fury.io/js/pastoralist.svg)](https://badge.fury.io/js/pastoralist)
![ci](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![Github](https://badgen.net/badge/icon/github?icon=github&label&color=grey)](https://github.com/yowainwright/mini-cookies)
![Twitter](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Fyowainwright%2Fpastoralist)

Manage your `package.json` **`*overrides and resolutions`** with ease!

---

## What _are_ \*overrides and resolutions?

Overrides and resolutions solve the same problem. 

They give developers a way to specify dependency versions downloaded to repository's `node_modules` folder. This is done by adding an `overrides` or `resolutions` object to a repository's root `package.json`. This is awesome when fix dependency issues with security and/or code issues.

---

## Why is Patoralist Awesome?

It is easy to lose track of _why_ a dependency is in an `overrides` or `resolutions` object.
This is an inconvenient problem when trying to maintain dependencies over time.

### _Until now!_

After installing Pastoralist. 

By running: 

```sh
pastoralist
```

as a CLI command, an override/resolution which looks like this:

```js
// package.json
"overrides": {
  "trim": "^0.0.3"
},
```

Will look like this:

```js
// package.json
"overrides": {
  "trim": "^0.0.3"
},
"pastoralist": {
  "appendix": {
    "trim@^0.0.3": {
      "dependenents": {
        "remark-parse": "4.0.0"
      }
    }
  }
}
```

But there's more!

If **Pastoralist** is run and a `resolution` or `override` is no longer required

### Pastoralist will clean up itself and resolutions!

AKA, the object above, will now look like the object below if `trim` is no longer needed.

```js
"overrides": {},
"pastoralist": {
  "appendix": {}
}
```

---

## How does Pastoralist work?

**Pastoralist** manages `overrides` and `resolutions` so you don't have to!

Pastoralist is comprised of a few functions which read `package.json` file(s) and reduce overrides or resolutions within the root `package.json` into a single `pastoralist.appendix` object.

- Pastoralist adds a `pastoralist.appendix` with a list of "resolved" dependencies.
- Better yet, if Pastoralist observes an `override` or `resolution` is no longer needed, it removes it from `resolutions`, `overrides`, and the pastoralist `appendix` object.
- This means with Pastoralist, your **only** concern is adding dependencies to the `overrides` and `resolutions` objects.

### Key notes

- Pastoralist does **not** manage what is added to overrides and resolutions objects.
- Pastoralist does manage dependenceis that exist in a `package.json`'s `overrides` or `resolutions` object.
- Pastoralist will remove overrides and resolutions if they become unneeded according to child `package.json`'s spec!
- View the [Pasture lifecycle doc](./docs/pasture-lifecycle.md) to get some visuals into what Pastoralist has got going on!

---

## Install

```sh
npm install pastoralist --save-dev
```

---

## Usage

Pastoralist is built to be used as a CLI program and runs with a single word "pastoralist".`

```sh
pastoralist
# => That's it! Chack out your package json
```

**Pastoralist** can _and should_ be incorporated into your workflow—which ever way is best for you and your team's developer experience! 👌

---

### Pastoralist Object Anatomy

When **Pastoralist** is run in a respository with override or resolution dependencies, it will output a shape like below.

```js
// package.json
"pastoralist": {
  // the appendix contains mapped resolutions/overrides
  "appendix": {
    // the resolution/override is stringified with it's version
    "trim@^0.0.3": {
      // dependents cantain dependents which actuall require the override/resolution dependency
      "dependenents": {
        "remark-parse": "4.0.0"
      }
    }
  }
}
```

When ever **Pastoralist** is run again, it will check the `pastoralist.appendix` object and remove any resolutions/overrides that are no longer needed.

---

## Pasturalist Lifecycle

When **Pasturalist** is run, it does 2 things—**review** and **update** resolutions/overrides within a root `package.json` file.

1. **Review**
   - it creates/re-creates an appendix which is an appendix resolutions/overrides.
2. **Update**
   - it reviews the appendix for dependents which can be removed from resolutions/overrides.

---

### Review

**Pasturalist** creates a pastoralist object which maps `overrides/resolutions/pnpm.overrides` dependents to `pastoralist.appendix`.

```mermaid
flowchart LR
A(finds overrides/resolutions/pnpm.overrides);
A --> B(nests mapped dependents to pastoralist.appendix);
A --> C(checks pastoralist.appendix for item to be updated);
```

---

### Update

**Pastoralist** checks `pastoralist.appendix` and removes unneeded `overrides/resolutions` from their corresponding declarations.

```mermaid
flowchart LR
A(checks pastoralist.appendix for item to be updated);
A --> B(updates pastoralist.appendix);
A --> C(updates overrides/resolutions/pnpm.overrides);
```

---

## Roadmap

**Updated `2022-08-06`**

- More tests (in progress)
- Provide more configuration options using a tool like [cosmiconfig](https://github.com/davidtheclark/cosmiconfig)
- Provide caveats, code examples, and more documentation
- **Note:** the shape of the `pastoralist` object may change rapidly currently to improve the API.
  - **However, Pastoralist** is built to work on it's own so, generally, you shouldn't worry about it!
  
---

Made by [@yowainwright](https://github.com/yowainwright) for fun with passion! MIT, 2022
