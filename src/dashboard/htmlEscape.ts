const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapes text before embedding it in generated HTML. Dashboard content is sourced from
 * run/evidence/verification data, some of which (evidence descriptions, verification detail,
 * decision notes) may ultimately be LLM- or agent-authored text — it must never be interpreted as
 * markup by a browser rendering the generated page.
 */
export function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ESCAPE_MAP[char] ?? char);
}
