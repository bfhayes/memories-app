import { useState } from 'react';
import { clsx } from 'clsx';

/**
 * A photograph rendered over its placeholder tone (with the vintage sheen), fading in once
 * decoded. The tone shows instantly so the grid never flashes empty.
 */
export default function Photo({
  src,
  tone,
  alt = '',
  className,
  imgClassName,
  loading = 'lazy',
}: {
  src?: string | null;
  tone: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  loading?: 'lazy' | 'eager';
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div
      className={clsx('relative overflow-hidden tone-sheen', className)}
      style={{ backgroundColor: tone }}
    >
      {src && (
        <img
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={clsx('h-full w-full object-cover img-fade', loaded && 'is-loaded', imgClassName)}
        />
      )}
    </div>
  );
}
