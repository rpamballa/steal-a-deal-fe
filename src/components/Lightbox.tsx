import React, {useCallback, useEffect, useState} from 'react';

type Props = {
  images: string[];
  startIndex?: number;
  alt: string;
  onClose: () => void;
};

export function Lightbox({images, startIndex = 0, alt, onClose}: Props) {
  const [index, setIndex] = useState(startIndex);

  const go = useCallback(
    (delta: number) => {
      setIndex(current => {
        const next = (current + delta + images.length) % images.length;
        return next;
      });
    },
    [images.length],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') go(1);
      if (event.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [go, onClose]);

  if (images.length === 0) return null;

  return (
    <div
      className="lightbox-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} — photo viewer`}
      onClick={onClose}>
      <button
        type="button"
        className="lightbox-close"
        aria-label="Close photo viewer"
        onClick={onClose}>
        ×
      </button>

      {images.length > 1 ? (
        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          aria-label="Previous photo"
          onClick={event => {
            event.stopPropagation();
            go(-1);
          }}>
          ‹
        </button>
      ) : null}

      <figure
        className="lightbox-figure"
        onClick={event => event.stopPropagation()}>
        <img
          className="lightbox-image"
          src={images[index]}
          alt={`${alt} — photo ${index + 1} of ${images.length}`}
        />
        <figcaption className="lightbox-caption">
          {index + 1} / {images.length}
        </figcaption>
      </figure>

      {images.length > 1 ? (
        <button
          type="button"
          className="lightbox-nav lightbox-next"
          aria-label="Next photo"
          onClick={event => {
            event.stopPropagation();
            go(1);
          }}>
          ›
        </button>
      ) : null}

      {images.length > 1 ? (
        <div
          className="lightbox-thumbs"
          onClick={event => event.stopPropagation()}>
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              className={
                i === index ? 'lightbox-thumb active' : 'lightbox-thumb'
              }
              aria-label={`Go to photo ${i + 1}`}
              onClick={() => setIndex(i)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
