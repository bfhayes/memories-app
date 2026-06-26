import { useState, type CSSProperties } from 'react';
import { clsx } from 'clsx';

/**
 * A photograph rendered over its placeholder tone (with the vintage sheen), fading in once decoded.
 * The tone shows instantly so the grid never flashes empty.
 *
 * `contain` mode shows the whole photo uncropped on a dark bezel (for the single-photo viewer /
 * Detective). Default `cover` mode fills the frame (for uniform-ish grid tiles).
 */
export default function Photo({
  src,
  tone,
  alt = '',
  className,
  imgClassName,
  loading = 'lazy',
  contain = false,
  style,
}: {
  src?: string | null;
  tone: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
  contain?: boolean;
  style?: CSSProperties;
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={clsx('relative overflow-hidden', !contain && 'tone-sheen', className)}
      style={{ backgroundColor: contain ? 'var(--color-bezel)' : tone, ...style }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={clsx(
            'h-full w-full img-fade',
            contain ? 'object-contain' : 'object-cover',
            loaded && 'is-loaded',
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
