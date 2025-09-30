
import { getConfig } from '../config';

// Set a nested value (with a style-smart fallback)
function setByPath(target, path, value) {
  if (!Array.isArray(path) || path.length === 0) return;

  let ref = target;
  for (let i = 0; i < path.length - 1; i++) {
    if (ref == null) throw new Error(`Path invalid at "${path[i]}"`);
    ref = ref[path[i]];
  }

  const lastKey = path[path.length - 1];

  // Special case: if we're setting a CSS style and the key isn't a known property,
  // try setProperty with a kebab-cased name (e.g., "background-image")
  if (ref instanceof CSSStyleDeclaration) {
    const hasProp = lastKey in ref;
    if (hasProp) {
      ref[lastKey] = value;
    } else {
      const kebab = lastKey.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
      ref.setProperty(kebab, value);
    }
    return;
  }

  ref[lastKey] = value;
}

getConfig().then((config) => {
  var identifier = window.location.pathname.split("/").pop().replaceAll(".html",String());
  for (const entry of config.pageMappings[identifier]) {
    setByPath(document.getElementById(entry["id"]), entry["path"].split("."), entry["value"]);
  }
});