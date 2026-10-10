/** CSS variable for a user series color (cycles through the 6 Nordic hues). */
export function userColor(index: number): string {
  return `var(--u${index % 6})`;
}
