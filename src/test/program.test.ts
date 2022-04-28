import { exec } from "child_process";
import { test, expect } from "vitest";
import { stdoutToJSON } from "stdouttojson";

test("program", () => {
  exec("ts-node ../program.ts --isTestingCLI", async (_, stdout) => {
    const result = await stdoutToJSON(stdout);
    expect(result).toEqual("");
  });
});
