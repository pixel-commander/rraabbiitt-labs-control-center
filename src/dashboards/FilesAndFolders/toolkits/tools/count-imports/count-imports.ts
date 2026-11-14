import { importsFinder, responseFor } from '../../_shared/finders.ts';
import type { FinderSettings } from '../../FilesAndFolders.types.ts';
import type { ToolsProps, ToolReturn } from "../../../../../../toolkit/Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = await responseFor(props as FinderSettings, await importsFinder(props as FinderSettings));
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794630244310, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
