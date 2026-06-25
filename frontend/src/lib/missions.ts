import type { LibraryFilter, MemoryStats } from './types';

export type MissionKey = 'date' | 'people' | 'story' | 'place';

export interface Mission {
  key: MissionKey;
  glyph: string;
  title: string;
  prompt: string;
  tint: string;
  color: string;
  filter: LibraryFilter;
  count: (s: MemoryStats) => number;
}

export const MISSIONS: Mission[] = [
  { key: 'date', glyph: '📅', title: 'Add dates', prompt: 'When was this taken?', tint: '#FBF1EC', color: '#C4704F', filter: 'needs_date', count: (s) => s.missingDate },
  { key: 'people', glyph: '👤', title: 'Name people', prompt: 'Do you recognize anyone?', tint: '#EEF1E9', color: '#7A8B6F', filter: 'needs_people', count: (s) => s.missingPeople },
  { key: 'story', glyph: '✍️', title: 'Tell stories', prompt: 'What do you remember?', tint: '#F0EAE0', color: '#B08A6B', filter: 'needs_story', count: (s) => s.missingStory },
  { key: 'place', glyph: '📍', title: 'Add places', prompt: 'Where was this?', tint: '#EFEAF2', color: '#8C7BA0', filter: 'needs_location', count: (s) => s.missingLocation },
];

export function missionByKey(key: string): Mission | undefined {
  return MISSIONS.find((m) => m.key === key);
}
