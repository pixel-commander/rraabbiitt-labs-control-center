StarRanking
===========

Controlled criterion star scores with configurable maximum, clear-on-repeat selection and derived total.

Implementation: StarRanking.tsx
Exports: StarRanking

Render this component with the props below. Application data and persistence remain with the caller.

Customization
-------------
UI classes can be overridden via theme tokens, component tokens, supplied className/container_class/cell_class/event_class props where exposed, or CSS in a parent/external stylesheet. Use only the class props declared by this implementation. The component base class stays in place. An omitted container_class uses the implementation default; an empty string deliberately removes that default. Parent CSS can target the component base class and its documented child classes. Put stylesheet overrides after defaults or in the overrides layer. Tokens must be applied to the component element when it defines its own defaults. Plain functions do not render containers; style the elements supplied to them.

Sizing
------
The caller supplies available layout space. Scroll regions require a bounded grid track and min-block-size: 0. Preview-only dimensions belong in demo files, not reusable component defaults.

Public types
------------
import type { ReactNode } from "react";
import type { HouseKeys, HandlerKey } from "../../HouseKeys.types";
export interface StarRankingCriterion extends HouseKeys {
  name: string;
}
export interface StarRankingChange {
  criterion: StarRankingCriterion;
  value: number;
  total: number;
}
export interface StarRankingProps extends HouseKeys {
  children?: ReactNode;
  className?: string;
  criteria?: StarRankingCriterion[];
  scores?: Record<string, number>;
  max?: number;
  disabled?: boolean;
  readOnly?: boolean;
  showTotal?: boolean;
  handleChange?: HandlerKey<StarRankingChange, "star-ranking", void>;
}


Usage skill
-----------
name: use-star-ranking
type: skill
path: src/components/StarRanking
file: use.skill.yaml
instructions: >-
  Render StarRanking with criteria as HouseKeys records having unique names, scores
  keyed by criterion name, and optional max (default 5). Parent owns scores. The
  handleChange(data, star-ranking, props) callback returns {criterion, value, total};
  apply value to that criterion in the parent. Clicking the current score requests
  zero. Scores are clamped integer values. disabled or readOnly prevents changes;
  showTotal defaults true. No fetching, saving, routing or internal score state.
