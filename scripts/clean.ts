import { rmSync, existsSync } from "fs";
import { resolve } from "path";

const distPath = resolve(process.cwd(), "dist");
const tsBuildInfoPath = resolve(process.cwd(), ".tsbuildinfo");

if (existsSync(distPath)) {
  rmSync(distPath, { recursive: true, force: true });
  console.log("✅ Cleaned dist directory");
} else {
  console.log("✓ dist directory does not exist, nothing to clean");
}

if (existsSync(tsBuildInfoPath)) {
  rmSync(tsBuildInfoPath, { force: true });
}
