#!/usr/bin/env node
// @ts-check
import { run } from "../dist/cli.mjs";

run(process.argv).catch((error) => {
  console.error(error);
  process.exit(1);
});
