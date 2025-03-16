import typia from "typia";

import type { UserConfig } from "../config";

/**
 * @private
 */
// 普通の typia.json.schemas を使うと OpenAPI docs 用の json schema が生成されるが、
// 今回欲しいのは普通の json schema なので HACK ではあるが typia.llm.schema を使う。
// @ts-expect-error 想定されていない使い方なので型エラーが出ているが、単に json schema を生成するだけなら問題なので無視する
export const UserConfigJsonSchema = typia.llm.schema<UserConfig, "3.1">();
