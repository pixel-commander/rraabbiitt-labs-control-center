import type { CodeFile } from "../../CodeEditAndView.types";
import type { CodeDiagnostic } from "../../CodeViewer/CodeViewer.types";

/** Syntax check only. Project-wide semantic checks are supplied by handleValidate. */
export const validateCode = async ({
  code,
  file,
  language,
}: CodeFile): Promise<CodeDiagnostic[]> => {
  if (language === "json") {
    try {
      JSON.parse(code);
      return [];
    } catch (error) {
      return [
        {
          severity: "error",
          message: error instanceof Error ? error.message : String(error),
        },
      ];
    }
  }
  if (
    !["ts", "tsx", "js", "jsx", "typescript", "javascript"].includes(language)
  )
    return [];
  const ts = await import("typescript");
  const result = ts.transpileModule(code, {
    fileName: file,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.ReactJSX,
      isolatedModules: true,
    },
  });
  return (result.diagnostics ?? []).map((diagnostic) => {
    const position =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start)
        : undefined;
    return {
      severity:
        diagnostic.category === ts.DiagnosticCategory.Error
          ? "error"
          : "warning",
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
      ...(position
        ? { line: position.line + 1, column: position.character + 1 }
        : {}),
    };
  });
};
