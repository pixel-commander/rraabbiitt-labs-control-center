export interface CompositionValidationError {
  /** Location in the supplied document, such as root.children[0].name. */
  path: string;
  message: string;
}

export interface CompositionValidationResult {
  error_count: number;
  errors: CompositionValidationError[];
  summary: {
    nodes: number;
    tags: Record<string, number>;
    classes: Record<string, number>;
    css: Record<string, number>;
    grids: Record<string, number>;
    display: Record<string, number>;
  };
}
