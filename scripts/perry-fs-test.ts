import * as fs from "fs";
import { join } from "path";

const directory = join(process.cwd(), "perry-fs-output");
const probe = join(directory, `.write-test-${process.pid}-${Math.random().toString(36).slice(2)}`);
fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(probe, "");
fs.unlinkSync(probe);
fs.writeFileSync(join(directory, "success.txt"), "hello");
