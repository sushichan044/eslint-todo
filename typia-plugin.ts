import type { Options } from "@ryoppippi/unplugin-typia";

import UnpluginTypiaRollUp from "@ryoppippi/unplugin-typia/rollup";
import UnpluginTypiaVite from "@ryoppippi/unplugin-typia/vite";

const typiaOptions: Options | undefined = undefined;

export const typiaRollup = UnpluginTypiaRollUp(typiaOptions);
export const typiaVite = UnpluginTypiaVite(typiaOptions);
