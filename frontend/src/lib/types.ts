export type DateConfidence = 'exact' | 'month-year' | 'year' | 'approx' | 'unknown';

export interface MemorySummary {
  id: number;
  name: string;
  yearLabel: string | null;
  coverTone: string;
  coverThumbKey: string | null;
  photoCount: number;
  createdAt: string;
}

export interface MemoryDetail extends MemorySummary {
  unlocked: boolean;
}

export interface Contributor {
  id: number;
  name: string;
  accent: string;
}

export interface Person {
  id: number;
  name: string;
  accent: string;
}

export interface PhotoSummary {
  id: number;
  thumbUrl: string;
  tone: string;
  width: number | null;
  height: number | null;
  favorite: boolean;
  dateLabel: string | null;
  dateConfidence: DateConfidence;
  hasDate: boolean;
  hasPeople: boolean;
  hasStory: boolean;
  hasLocation: boolean;
  peopleCount: number;
  tagCount: number;
  needs: Array<'date' | 'people' | 'story' | 'location'>;
  uploadedAt: string;
  updatedAt: string;
}

export interface PhotoPage {
  photos: PhotoSummary[];
  nextOffset: number | null;
}

export interface PhotoDate {
  value: string | null;
  confidence: DateConfidence;
  label: string | null;
}

export interface ActivityEntry {
  id: number;
  name: string;
  accent: string;
  action: string;
  detail: string;
  createdAt: string;
}

export interface PhotoDetail {
  id: number;
  memoryId: number;
  url: string;
  thumbUrl: string;
  tone: string;
  width: number | null;
  height: number | null;
  favorite: boolean;
  date: PhotoDate;
  location: string | null;
  about: string | null;
  notes: string | null;
  people: Person[];
  tags: string[];
  activity: ActivityEntry[];
  meta: {
    added: string;
    source: string;
    file: string | null;
    fileSize: number | null;
    photoId: number;
  };
}

export interface Suggestions {
  people: Person[];
  locations: string[];
  tags: string[];
}

export interface MemoryStats {
  total: number;
  needsInfo: number;
  missingDate: number;
  missingPeople: number;
  missingStory: number;
  missingLocation: number;
  hasDate: number;
  hasPeople: number;
  hasStory: number;
  favorites: number;
  contributors: number;
  completion: number;
  decades: Array<{ decade: number; count: number }>;
}

export type LibraryFilter =
  | 'all'
  | 'needs_info'
  | 'has_date'
  | 'needs_date'
  | 'has_people'
  | 'needs_people'
  | 'has_story'
  | 'needs_story'
  | 'needs_location'
  | 'favorites';

export type LibrarySort =
  | 'recent_uploaded'
  | 'recent_updated'
  | 'oldest_taken'
  | 'newest_taken';
