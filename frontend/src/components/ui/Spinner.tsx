import { clsx } from 'clsx';

export default function Spinner({ size = 22, className, color = 'currentColor' }: { size?: number; className?: string; color?: string }) {
  return (
    <span
      className={clsx('inline-block animate-spin-slow rounded-full align-middle', className)}
      style={{
        width: size,
        height: size,
        borderWidth: Math.max(2, Math.round(size / 9)),
        borderStyle: 'solid',
        borderColor: color,
        borderTopColor: 'transparent',
      }}
      aria-hidden
    />
  );
}
