export interface DragScrollProps {
  flick?: boolean;
  smooth?: boolean;
  sensitivity?: number;
}
export const defaultProps: Readonly<Required<DragScrollProps>>;
export const dragScroll: (
  ref: HTMLElement | { current: HTMLElement | null } | null,
  props?: DragScrollProps,
) => () => void;
export default dragScroll;
