import type { ReactNode } from "react";
import type { HandlerKey, HouseKeys } from "../../../../HouseKeys.types";
import { PaddingSideIcon } from "../../../../icons/PaddingSideIcon";
import { RadiusIcon } from "../../../../icons/RadiusIcon";
import { factorySizes, getPadding, paddingSides } from "./js/sizeStyles";
import type { PaddingValues } from "./js/sizeStyles";
import type { FactoryPadding, FactorySize, FactorySizeValue } from "./ComponentFactory.types";

interface SizeSelectProps extends HouseKeys {
  label: string;
  value?: FactorySizeValue;
  handleChange?: HandlerKey<FactorySize, "size", void, SizeSelectProps>;
}

export const SizeSelect = (props: SizeSelectProps) => {
  const { label, value, handleChange } = props;
  return (
    <select
      aria-label={label}
      value={value ?? ""}
      onChange={(event) => handleChange?.(factorySizes.find((size) => size === event.target.value), "size", props)}
    >
      <option value="">Default</option>
      {typeof value === "number" && <option value={value} disabled>{value} px</option>}
      {factorySizes.map((size) => <option key={size}>{size}</option>)}
    </select>
  );
};

type SizeFieldsChange<Key extends string> =
  | { all: boolean }
  | { value?: FactorySize }
  | { field: Key; value?: FactorySize };

interface SizeFieldsProps<Key extends string> extends HouseKeys {
  label: string;
  all: boolean;
  value?: FactorySizeValue;
  values?: Partial<Record<Key, FactorySizeValue>>;
  fields: readonly Key[];
  renderIcon: (key: Key) => ReactNode;
  handleChange?: HandlerKey<SizeFieldsChange<Key>, "size-fields", void, SizeFieldsProps<Key>>;
}

export const SizeFields = <Key extends string,>(props: SizeFieldsProps<Key>) => {
  const { label, all, value, values, fields, renderIcon, handleChange } = props;
  return (
    <div className="component-factory-size-fields" role="group" aria-label={label}>
      <div className="component-factory-size-fields__row" data-grid="side-left">
        <label data-area="side">
          {label}: <input type="checkbox" checked={all} onChange={(event) => handleChange?.({ all: event.target.checked }, "size-fields", props)} /> All
        </label>
        {all && (
          <div data-area="main">
            <SizeSelect label={label} value={value} handleChange={(size) => handleChange?.({ value: size }, "size-fields", props)} />
          </div>
        )}
      </div>
      {!all && (
        <div data-cols="4" data-gap="control">
          {fields.map((key) => (
            <label key={key}>
              {renderIcon(key)}
              <SizeSelect
                label={`${label} ${key}`}
                value={values?.[key]}
                handleChange={(size) => handleChange?.({ field: key, value: size }, "size-fields", props)}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

interface PaddingFieldsProps extends HouseKeys {
  style: PaddingValues;
  handleChange?: HandlerKey<FactoryPadding, "padding", void, PaddingFieldsProps>;
}

export const PaddingFields = (props: PaddingFieldsProps) => {
  const { style, handleChange } = props;
  const { all, values } = getPadding(style);

  return (
    <SizeFields
      label="Padding"
      all={all}
      value={style.padding}
      values={values}
      fields={paddingSides}
      renderIcon={(side) => <PaddingSideIcon side={side} />}
      handleChange={(change) => {
        if (!change) return;
        if ("all" in change) handleChange?.({ paddingAll: change.all }, "padding", props);
        else if ("field" in change) {
          handleChange?.({ paddingSides: { ...values, [change.field]: change.value } }, "padding", props);
        } else handleChange?.({ padding: change.value }, "padding", props);
      }}
    />
  );
};
