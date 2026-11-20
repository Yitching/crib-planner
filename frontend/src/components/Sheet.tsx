import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
}

/** A bottom sheet that slides up over the dimmed page. */
export function Sheet({ title, eyebrow, onClose, children }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <span className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id="sheet-title" ref={titleRef} className="sheet__title" tabIndex={-1}>{title}</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        {children}
      </section>
    </>
  );
}
