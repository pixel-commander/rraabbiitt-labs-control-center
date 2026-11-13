import type { FactoryComposition } from "../ComponentFactory.types";

export interface JsonPreviewProps {
  composition: FactoryComposition;
  handleClose: () => void;
}
