# Pastoralist (WIP)

A tool to watch over node module *`overrides` and *`resolutions` 🐑 👩🏽‍🌾

> \***overrides and resolutions**: throughout this repository the key words "overrides" and "resolutions" are used interchangeably because nomenclature between npm, pnpm, and yarn varies. However, the reason and resolution are the same! Use Pastoralist!
## Synopsis

To maintain a secure `node_module` ecosystem, the `package.json` keys `overrides` and `resolutions` have implemented to be by [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), and [pnpm](https://pnpm.io/) to provide developers with a last-resort way to fix dependency vulnerabilities.

**Pastoralist** manages `overrides` and `resolutions` so you don't have to!
## How Pastoralist works

- It adds an `appendix` to a `pastoralist` key within a project's `package.json` which lists dependencies that are dependent on the `overrides` and `resolutions` keys.
- Better yet, if Pastoralist observes an `override` or `resolution` is no longer needed, it will remove it from the `resolutions`, `overrides`, and pastoralist `appendix` objects.
- This means developers only concern is adding dependencies to the `overrides` and `resolutions` objects.

### Key notes

- Pastoralist does **not** manage what is added to overrides and resolutions objects.
- Pastoralist **does** manage packages that exists in the overrides or resolutions objects.
  - Pastoralist will remove overrides and resolutions if they become unneeded according to child `package.json`'s spec!

## Inistall

```sh
npm install pastoralist --save-dev
# pastoralist does not expect to be a dependency! It's a tool!!!
```

## Usage

Pastoralist is built to be used as a CLI program which runs initially with a single word "pastoralist".`

```sh
pastoralist
# => That's it! Chack out your package json
```

Pastoralist can _and should be incorporated_ into your workflow—which ever way is best for you and your team's developer experience! 👌


## Roadmap

- [ ] More tests
- [ ] Provide more configuration options using a tool like [cosmiconfig](https://github.com/davidtheclark/cosmiconfig).
- [ ] Provide caveats, code examples, and more documentation.
