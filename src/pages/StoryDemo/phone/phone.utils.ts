import { EMOJI_GRID } from './phone.constants';

export function findEmojiCoords(emoji: string): { row: number; col: number } | null {
  for (let r = 0; r < EMOJI_GRID.length; r++) {
    const c = EMOJI_GRID[r].indexOf(emoji);
    if (c >= 0) return { row: r, col: c };
  }
  return null;
}

export function isEmojiLike(ch: string): boolean {
  return [...ch].some(cp => (cp.codePointAt(0) ?? 0) > 127);
}
