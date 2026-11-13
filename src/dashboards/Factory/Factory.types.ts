import type { ComponentFactoryProps } from "./components/ComponentFactory/ComponentFactory.types";
import type { FactoryDocument } from "./components/ComponentFactory/ComponentFactory.types";
import type { HouseKeys } from "../../HouseKeys.types";

export interface FactoryProps extends ComponentFactoryProps {}

export type FactoryArtifactType = "component" | "subcomponent" | "page" | "dashboard";

export interface FactorySaveData extends HouseKeys {
  /** Component name supplied to the runner. It is prefilled from the designer. */
  name: string;
  /** Required display title saved with the component metadata. */
  title: string;
  /** Required destination components folder, absolute or relative to the configured project. */
  path: string;
  /** Artifact category. Selects the matching scaffold. */
  type: FactoryArtifactType;
  destinations?: Record<FactoryArtifactType, string>;
  /** Required description stored in the component metadata and composition file. */
  description: string;
  /** Editable composition source saved separately from its generated JSX and CSS. */
  composition: FactoryDocument;
  /** Explicit confirmation to replace an existing component's generated files. */
  overwrite?: boolean;
}

export interface FactorySaveResult extends HouseKeys {
  /** Stable numeric ID assigned by the component scaffold. */
  id: number;
  /** Canonical component name returned by the runner. */
  name: string;
  /** Destination components folder used to create the component. */
  path: string;
  /** Absolute path of the saved composition JSON file. */
  file: string;
}

export interface FactoryOverwriteConfirmation extends HouseKeys {
  /** Stable ID of the component found at the requested destination. */
  id: number;
  /** Existing component name confirmed by its metadata. */
  name: string;
  /** Destination components folder containing that component. */
  path: string;
}
