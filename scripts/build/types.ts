export type BuildTarget = "dist" | "bundle" | "types" | "bin" | "clean";

export type BuildLogger = {
  fail: (message: string) => void;
  print: (message: string) => void;
};

export type RuntimePackageManifest = {
  main: string;
  name: string;
  type: "commonjs";
  version: string;
};

export type RolldownBuildConfig = {
  external: readonly string[];
  input: string;
  minify: boolean;
  outDir: string;
  splitting: boolean;
  target: "node";
};
