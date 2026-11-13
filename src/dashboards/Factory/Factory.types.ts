import type { ComponentFactoryProps } from "./components/ComponentFactory/ComponentFactory.types";
import type { FactoryComposition } from "./components/ComponentFactory/ComponentFactory.types";
import type { HouseKeys } from "../../HouseKeys.types";

export interface FactoryProps extends ComponentFactoryProps {}

export interface FactorySaveData extends HouseKeys {
  /** Component name supplied to the runner. It is prefilled from the designer. */
  name: string;
  /** Required display title saved with the component metadata. */
  title: string;
  /** Registered project root whose component destination the runner will use. */
  path: string;
  /** Artifact category. This save flow currently supports components. */
  type: "component";
  /** Required description stored in the component metadata and composition file. */
  description: string;
  /** Editable composition source saved separately from its generated JSX and CSS. */
  composition: FactoryComposition;
  /** Explicit confirmation to replace an existing component's generated files. */
  overwrite?: boolean;
}

export interface FactorySaveResult extends HouseKeys {
  /** Stable numeric ID assigned by the component scaffold. */
  id: number;
  /** Canonical component name returned by the runner. */
  name: string;
  /** Project root used to create the component. */
  path: string;
  /** Absolute path of the saved composition JSON file. */
  file: string;
}

export interface FactoryOverwriteConfirmation extends HouseKeys {
  /** Stable ID of the component found at the requested destination. */
  id: number;
  /** Existing component name confirmed by its metadata. */
  name: string;
  /** Project root containing that component. */
  path: string;
}
