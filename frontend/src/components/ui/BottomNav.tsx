import { Link, useLocation } from 'react-router-dom';
import { ImagePlus, LayoutGrid, Search } from 'lucide-react';
import { clsx } from 'clsx';

const items = [
  { key: 'upload', label: 'Upload', icon: ImagePlus, to: (id: number) => `/m/${id}/upload` },
  { key: 'library', label: 'Library', icon: LayoutGrid, to: (id: number) => `/m/${id}/library` },
  { key: 'detective', label: 'Detective', icon: Search, to: (id: number) => `/m/${id}/detective` },
];

export default function BottomNav({ memoryId }: { memoryId: number }) {
  const { pathname } = useLocation();
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line-divider bg-warm/95 backdrop-blur safe-bottom lg:hidden">
      <div className="mx-auto flex max-w-2xl">
        {items.map(({ key, label, icon: Icon, to }) => {
          const href = to(memoryId);
          const active = pathname.startsWith(href);
          return (
            <Link
              key={key}
              to={href}
              className={clsx(
                'flex flex-1 flex-col items-center gap-1 py-2.5 transition-colors',
                active ? 'text-terracotta' : 'text-muted2',
              )}
            >
              <Icon size={24} strokeWidth={active ? 2.6 : 2.1} />
              <span className="text-[12px] font-bold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
