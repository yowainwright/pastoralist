
import { execPromise } from "./index";
import { GetRootDeps, RootDepItem } from "../interfaces";

import { logger } from "../logger";
import { IS_DEBUGGING } from "../constants";

const log = logger({ file: "utils/getRootDeps.ts", isLogging: IS_DEBUGGING });

export async function getRootDeps({ resolutions, exec = execPromise }: GetRootDeps): Promise<Array<RootDepItem>> {
  const logText = '[getRootDeps]:'
  const rootDepsList = Promise.all(
    resolutions.map(async (resolution: string): Promise<RootDepItem> => {
      try {
        const runner = 'npm'
        const cmd = ['ls', resolution, '--json']
        const { dependencies } = await exec(runner, cmd);
        const rootDeps = Object.keys(dependencies).map((dependency) => `${dependency}@${dependencies[dependency].version}`);
        log.debug(`${logText} ${resolution} has direct dependendents: ${rootDeps.join(", ")}`);
        return {
          resolution,
          rootDeps
        };
      } catch (err) {
        log.error(logText, { error: err });
        return {
          resolution,
          rootDeps: []
        };
      }
    })
  );
  return rootDepsList;
}
