import type {
  CodeFile,
  CodeEditAndViewProps,
} from "../../CodeEditAndView.types";
export const saveCodeFile = async (
  file: CodeFile,
  handleSave: CodeEditAndViewProps["handleSave"],
): Promise<void> => {
  if (!handleSave) throw new Error("No file-saving handler is connected.");
  await handleSave(file, "save-code");
};
