# [Pastoralist](https://jeffry.in/pastoralist/)

![Typed with TypeScript](https://flat.badgen.net/badge/icon/Typed?icon=typescript&label&labelColor=blue&color=555555)
[![npm version](https://badge.fury.io/js/pastoralist.svg)](https://badge.fury.io/js/pastoralist)
![ci](https://github.com/yowainwright/pastoralist/actions/workflows/ci.yml/badge.svg)
[![Github](https://badgen.net/badge/icon/github?icon=github&label&color=grey)](https://github.com/yowainwright/mini-cookies)
![Twitter](https://img.shields.io/twitter/url?url=https%3A%2F%2Fgithub.com%2Fyowainwright%2Fpastoralist)

#### Manage your package.json \*`overrides` or `resolutions` with ease!

With the Pastoralist CLI, you can ensure your project's overrides _(or resolutions)_ are kept up-to-date by running a single one word command! Jump to [setup](#setup) or scroll on!

---

## What _are_ \*overrides and resolutions?

> #### Overrides and resolutions solve the same problem.<br>They give developers a way to specify dependency versions downloaded to repository's node_modules folder.

Node package manager CLIs, like npm, yarn, and pnpm, enable engineers to solve dependency specificity issues by adding an overrides or resolutions object to a repository's root package.json. This is awesome for fixing dependency issues with security and/or code. Read more about [npm](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#overrides), [yarn](https://yarnpkg.com/configuration/manifest#resolutions), and [pnpm](https://pnpm.io/package_json#pnpmoverrides) overrides or resolution solutions.

---

## Why is Pastoralist Awesome?

> #### Is the override still needed?<br />Is there a better fix?<br />Like a security patch or a major release?

After using overrides or resolutions to fix dependency specificity issues for a while, it is easy to lose track of why a dependency is in an overrides or resolutions package.json object.

This is an inconvenient problem when trying to maintain dependencies over time.

This information is not really known—until now!

With Pastoralist CLI, you can run the `pastoralist` CLI command and an overrides (resolution) object that looks like this:

```js
// Note the trim dependency in overrides
"overrides": {
  "trim": "^0.0.3"
},
```

Will look like this:

```js
// Note the trim dependency is now added to the appendix
"overrides": {
  "trim": "^0.0.3"
},
"pastoralist": {
  "appendix": {
    "trim@^0.0.3": {
      "dependents": {
        "remark-parse": "4.0.0"
      }
    }
  }
}
```

But there's more!

If Pastoralist is run and an override or resolution is no longer required, Pastoralist will remove the dependency from pastoralist.appendix, overrides, or reslutions!

AKA, the object above, will now look like the object below if trim is no longer needed.

```js
// Note that since trim is no longer needed,
// it has been removed from the appendix and overrides
"overrides": {},
"pastoralist": {
  "appendix": {}
}
```

There is more to come with Pastoralist! But for now, by adding pastoralist to [package.json postInstall script](https://docs.npmjs.com/cli/v8/using-npm/scripts#npm-install), you don't have to worry about installing unneeded override or resolution packages anymore!

---

## How Pastoralist works

> #### Pastoralist manages overrides and resolutions so you don't have to!

It is comprised of a few functions which read the root package.json file's overrides or resolutions and map the packages in them to a `pastoralist.appendix` object.

If Pastoralist observes an override or resolution is no longer needed, it removes it from resolutions or overrides, and the pastoralist appendix object.

This means with Pastoralist, your only concern is adding dependencies to the overrides and resolutions objects.
Broken down, Pastoralist manages your overrides and resolutions with 4 simple steps demonstrated in the flow chart below.

<p align="center"><img src="https://user-images.githubusercontent.com/1074042/194803911-93097b50-3bff-4529-879c-81fd161e7bfa.gif" /></p>

### Key notes

1. Pastoralist does **not** manage what is added to overrides or resolutions objects.
2. Pastoralist **does** manage dependenceis that exists in a `package.json`'s overrides or resolutions objects.
3. Pastoralist will remove overrides and resolutions if they become unneeded according to child package.json's spec!

---

## Setup

> #### Okay! Hopefully the breakdowns above were clear enough on why you might want to use Pastoralist!

Please submit a [pull request](https://github.com/yowainwright/pastoralist/pulls) or [issue](https://github.com/yowainwright/pastoralist/issues) if it wasn't!

Now for the super simple setup!

1. Install

```bash
npm install pastoralist --save-dev
# pastoralist does not expect to be a dependency! It's a tool!!!
```

2. run

```bash
pastoralist
# => That's it! Check out your package.json
```

3. (recommended) add Pastoralist to a postInstall script

```js
// package.json
{
  "scripts": {
    "postinstall": "pastoralist"
  }
}
```

In the near feature, Pastoralist will fully support a config file but this is it for now!

Read on to understand what is going on under the hood of Pastoralist!

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
      // dependents contain dependents which actually require the override/resolution dependency
      "dependenents": {
        "remark-parse": "4.0.0"
      }
    }
  }
}
```

When ever **Pastoralist** is run again, it will check the `pastoralist.appendix` object and remove any resolutions/overrides that are no longer needed.

---

## Roadmap

#### Updated `2022-10-09`

- Provide more configuration options using [cosmiconfig](https://github.com/davidtheclark/cosmiconfig)
- Provide caveats, code examples, and more documentation
- **Note:** the shape of the `pastoralist` object may change rapidly currently to improve the API.

## Thanks

Shout out to [Bryant Cabrera](https://github.com/bryantcabrera) and the infamous [Mardin](https://github.com/mardinyadegar) for all the fun conversation, insights, and pairing around this topic.

---

Made by [@yowainwright](https://github.com/yowainwright) for fun with passion! MIT, 2022
