/** True on phones/tablets without a mouse (matches the Tailwind `touch:` variant). */
export function isTouchDevice(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none) and (pointer: coarse)').matches;
}
