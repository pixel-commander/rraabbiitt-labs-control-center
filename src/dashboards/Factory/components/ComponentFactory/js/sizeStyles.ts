import type { FactoryPadding, FactorySizeValue, FactorySurfaceStyle } from "../ComponentFactory.types";

export const factorySizes = ["xs", "sm", "md", "base", "lg", "xl"] as const;

export const factorySizeCss = (value: FactorySizeValue | undefined, token = "space") => {
  if (value === undefined) return undefined;
  return typeof value === "number" ? `${value}px` : `var(--${token}-${value})`;
};

export const paddingSides = ["left", "top", "right", "bottom"] as const;

export const radiusCorners = ["top-left", "top-right", "bottom-right", "bottom-left"] as const;

export type PaddingValues = FactoryPadding & Pick<FactorySurfaceStyle, "paddingX" | "paddingY">;

export const getPadding = (style: PaddingValues) => {
  const { padding, paddingX, paddingY, paddingSides, paddingAll } = style;
  const hasLegacyAxes = paddingX !== undefined || paddingY !== undefined;
  return {
    all: paddingAll ?? !hasLegacyAxes,
    values: paddingSides ?? (hasLegacyAxes ? {
      left: paddingX ?? padding,
      top: paddingY ?? padding,
      right: paddingX ?? padding,
      bottom: paddingY ?? padding,
    } : {}),
  };
};

export const paddingCss = (style: PaddingValues) => {
  const { all, values } = getPadding(style);
  return all ? { padding: factorySizeCss(style.padding) } : {
    paddingLeft: factorySizeCss(values.left),
    paddingTop: factorySizeCss(values.top),
    paddingRight: factorySizeCss(values.right),
    paddingBottom: factorySizeCss(values.bottom),
  };
};
