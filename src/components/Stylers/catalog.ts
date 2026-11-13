const styles = import.meta.glob("../../atoms/{containers,actions,effects}/*/*.css", { eager: true });
export const atomNames = (type: "container" | "action" | "effect") => [...new Set(Object.keys(styles)
  .filter(path => path.includes('/' + (type === 'container' ? 'containers' : type === 'action' ? 'actions' : 'effects') + '/'))
  .map(path => path.split('/').at(-2)!))].sort();
export const themeColors = ["main", "main-alt", "primary", "primary-alt", "secondary", "secondary-alt", "tertiary", "tertiary-alt", "muted", "inverse"]
  .flatMap(name => ['--color-' + name, '--color-' + name + '-neg']);
