// @ts-check
import ts from "@virtual-live-lab/eslint-config/presets/ts";

import { eslintConfigTodo } from "./dist/eslint.mjs";

const todo = await eslintConfigTodo();

const config = [...ts, ...todo];

export default config;
