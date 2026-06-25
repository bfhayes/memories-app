// Mirrors the server palettes so client-generated colors match what's stored.

export const PHOTO_TONES = [
  '#9FA487', '#C9A28B', '#94A3AC', '#C2B193', '#B59BA0',
  '#A8B69C', '#BFA67E', '#8E9A93', '#A89A82',
];

export const AVATAR_COLORS = ['#C4704F', '#7A8B6F', '#B08A6B', '#8C7BA0', '#C9A14A'];

export function pickColor(palette: string[], seed: string | number): string {
  const s = String(seed);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function toneFor(seed: string | number): string {
  return pickColor(PHOTO_TONES, seed);
}

export function avatarColor(seed: string | number): string {
  return pickColor(AVATAR_COLORS, seed);
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
