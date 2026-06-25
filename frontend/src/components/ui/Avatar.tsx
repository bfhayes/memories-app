import { initials } from '../../lib/tones';

export default function Avatar({
  name,
  accent,
  size = 40,
}: {
  name: string;
  accent: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full text-white font-extrabold shrink-0"
      style={{
        width: size,
        height: size,
        background: accent,
        fontSize: Math.round(size * 0.4),
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
