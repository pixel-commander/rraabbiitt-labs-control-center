import type { FactoryDocument } from "../ComponentFactory.types";

export interface JsonPreviewProps {
  composition: FactoryDocument;
  handleClose: () => void;
}
