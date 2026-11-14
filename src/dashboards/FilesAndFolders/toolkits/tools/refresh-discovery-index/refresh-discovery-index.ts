import { scanFilesAndFolders } from './engine.ts';
import type { ScanFilesAndFoldersProps } from '../../../../../components/ScannerStatusUi/ScannerStatusUi.types.ts';
// @ts-expect-error Node runtime module.
import { publishProgress } from '../../../../../components/ScannerStatusUi/api/progress.mjs';
import type { ToolsProps, ToolReturn } from "../../../../../../toolkit/Tooling.types.ts";

/** @param {ToolsProps} props @returns {Promise<ToolReturn>} */
export const run = async (props: ToolsProps): Promise<ToolReturn> => {
  const settings = props;
  /** @type {ToolReturn} */
  let result: ToolReturn;
  try {
    result = await scanFilesAndFolders(props as ScanFilesAndFoldersProps, { progress: event => publishProgress(props.scan_id, event) });
  } catch (error) {
    result = { return_type: "results", status: "error", settings,
      error: error instanceof Error ? error.message : String(error) };
  }
  // Usage fires once, after the work and before return. No console output.
  try {
    const { finishToolUsage } = await import("../../../../../../api/tool-usage/finish-tool-usage.ts");
    return await finishToolUsage(1794630039559, settings, result);
  } catch (error) {
    return { ...result, error: [result.error,
      `Usage reporting failed: ${error instanceof Error ? error.message : String(error)}`]
      .filter(Boolean).join("\n") };
  }
};
