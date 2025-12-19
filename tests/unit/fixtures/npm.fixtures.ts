export const BASE_NPM_PACKAGE_INFO = {
  "dist-tags": {
    latest: "4.17.21",
  },
  versions: {
    "4.17.0": {},
    "4.17.1": {},
    "4.17.10": {},
    "4.17.11": {},
    "4.17.15": {},
    "4.17.20": {},
    "4.17.21": {},
  },
} as const;

export const PRERELEASE_VERSIONS = {
  "5.0.0-beta.1": {},
  "5.0.0-alpha.1": {},
} as const;

export const MULTI_MAJOR_VERSIONS = {
  "1.0.0": {},
  "1.0.1": {},
  "1.1.0": {},
  "1.2.0": {},
  "1.2.1": {},
  "2.0.0": {},
  "2.0.1": {},
  "2.0.5": {},
} as const;

export const ZERO_MAJOR_VERSIONS = {
  "0.1.0": {},
  "0.2.0": {},
  "0.3.0": {},
  "0.4.0": {},
  "0.5.0": {},
} as const;

export const mockOkResponse = (data: unknown) =>
  ({
    ok: true,
    json: () => Promise.resolve(data),
  }) as Response;

export const mockNotFoundResponse = () =>
  ({
    ok: false,
    status: 404,
  }) as Response;

export const createNpmPackageInfo = (
  latest: string,
  versions: Record<string, object>,
) => ({
  "dist-tags": { latest },
  versions,
});
