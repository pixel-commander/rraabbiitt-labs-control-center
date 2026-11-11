export interface EditorConfig {
  code: string;
  language: string;
  editable: boolean;
  disabled: boolean;
  lineNumbers: boolean;
  startLine: number;
  tabSize: number;
  label: string;
  diagnostics: readonly { message: string; severity: 'error' | 'warning'; line?: number; column?: number }[];
  onChange: (code: string) => void;
  onNavigate: (line: number, type: 'line-click' | 'minimap-navigate') => void;
  onViewport: (top: number, total: number, height: number) => void;
}
export interface EditorEngine {
  configure: (config: EditorConfig) => void;
  navigate: (line: number) => void;
  scroll: (fraction: number) => void;
  overview: (rows: number) => string[];
  destroy: () => void;
}
export function createEditor(parent: HTMLElement, config: EditorConfig): EditorEngine;
