import type { Options } from "@ryoppippi/unplugin-typia";

import UnpluginTypiaRolldown from "@ryoppippi/unplugin-typia/rolldown";
import UnpluginTypiaVite from "@ryoppippi/unplugin-typia/vite";

const typiaOptions: Options | undefined = undefined;

export const typiaVite = UnpluginTypiaVite(typiaOptions);
export const typiaRolldown = UnpluginTypiaRolldown(typiaOptions);
