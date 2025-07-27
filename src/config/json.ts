import typia from "typia";

import type { UserConfig } from "./config";

// 普通の typia.json.schemas を使うと OpenAPI docs 用の json schema が生成されるが、
// 今回欲しいのは普通の json schema なので HACK ではあるが typia.llm.schema を使う。
export const UserConfigJsonSchema = typia.llm.schema<
  UserConfig,
  "3.1",
  { constraint: true; reference: false }
>({});
