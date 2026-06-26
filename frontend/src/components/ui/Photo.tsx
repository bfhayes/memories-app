import { useEffect, useRef, useState, type CSSProperties } from 'react';
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
  const imgRef = useRef<HTMLImageElement>(null);

  // A cached image can already be `complete` before React attaches onLoad (e.g. after the tile
  // remounts on entering select mode), in which case onLoad never fires — catch that here so the
  // image doesn't get stuck invisible at opacity:0.
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) setLoaded(true);
  }, [src]);

  return (
    <div
      className={clsx('relative overflow-hidden', !contain && 'tone-sheen', className)}
      style={{ backgroundColor: contain ? 'var(--color-bezel)' : tone, ...style }}
    >
      {src && (
        <img
          ref={imgRef}
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
