import type { PhotoSummary } from '../lib/types';

const LABELS: Record<string, string> = {
  date: '📅 Add date',
  people: '👤 Who’s this?',
  story: '📝 Needs story',
  location: '📍 Add place',
};
// Date is the priority field everywhere.
const PRIORITY: Array<keyof typeof LABELS> = ['date', 'people', 'story', 'location'];

/** The single, gentle "needs info" pill shown bottom-left on a grid tile. */
export default function MissingBadge({ photo }: { photo: PhotoSummary }) {
  if (photo.needs.length === 0) return null;
  const top = PRIORITY.find((k) => photo.needs.includes(k as never));
  if (!top) return null;
  return (
    <span
      className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-bold text-white"
      style={{ background: 'rgba(30,22,16,0.62)', backdropFilter: 'blur(2px)' }}
    >
      {LABELS[top]}
    </span>
  );
}
