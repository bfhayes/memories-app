import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

export default function DetectiveBanner({ memoryId, count }: { memoryId: number; count: number }) {
  if (count <= 0) return null;
  return (
    <Link
      to={`/m/${memoryId}/detective`}
      className="flex items-center gap-3 rounded-[20px] px-4 py-3.5 text-white shadow-feature transition active:scale-[0.99]"
      style={{ background: 'linear-gradient(135deg, var(--color-sage), var(--color-sage-dark))' }}
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/20">
        <Search size={21} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-extrabold">
          {count.toLocaleString()} {count === 1 ? 'photo needs' : 'photos need'} your help
        </span>
        <span className="block text-[14px] text-white/85">A few taps to fill in dates, names &amp; stories</span>
      </span>
      <span className="rounded-full bg-white/20 px-4 py-2 text-[15px] font-bold">Start</span>
    </Link>
  );
}
