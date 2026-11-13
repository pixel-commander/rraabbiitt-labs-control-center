export function readThemeTokens() {
  const computed = getComputedStyle(document.documentElement),
    theme: Record<string, string> = {};
  for (const key of computed)
    if (key.startsWith("--")) {
      const value = computed.getPropertyValue(key).trim();
      if (value) theme[key] = value;
    }
  const visit = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (
        rule instanceof CSSMediaRule &&
        !matchMedia(rule.conditionText).matches
      )
        continue;
      if (
        rule instanceof CSSStyleRule &&
        document.documentElement.matches(rule.selectorText)
      )
        for (const key of rule.style)
          if (key.startsWith("--"))
            theme[key] = rule.style.getPropertyValue(key).trim();
      if (rule instanceof CSSGroupingRule) visit(rule.cssRules);
    }
  };
  for (const sheet of document.styleSheets)
    try {
      visit(sheet.cssRules);
    } catch {
      /* Keep computed values for unreadable cross-origin stylesheets. */
    }
  return theme;
}
