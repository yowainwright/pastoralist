# Manual CLI testing

From the repository root, build the CLI, then open an E2E environment:

```sh
pnpm run build
cd tests/e2e
PACKAGE_MANAGER=pnpm E2E_SCENARIO=patches docker compose run --rm --build e2e-shell
```

`PACKAGE_MANAGER`: `npm`, `pnpm`, `yarn`, or `bun`.

`E2E_SCENARIO`: `clean`, `overrides`, `patches`, or `security`.

Defaults are `pnpm` and `overrides`. Inside the shell, run `pastoralist`, `e2e-diff`, `e2e-reset`, or `e2e-install`. Exit to discard the container; package download caches persist.

For CLI changes, run the existing `pnpm run dev:cli` from the repository root in another terminal. The E2E shell uses the local `dist` directory.

The existing `pnpm run test:e2e` runner includes all 16 manager/scenario checks. To run just those checks from `tests/e2e`:

```sh
docker compose run --rm --build e2e-js-mgrs bash /app/tests/test-interactive.sh
```
