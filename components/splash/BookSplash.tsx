'use client';

// ============================================================
// components/splash/BookSplash.tsx
// Full-screen 3D book-opening splash animation.
// Shown on first visit per browser session (sessionStorage flag).
// Calls onComplete when the animation finishes.
// ============================================================

import { useEffect, useState } from 'react';
import './BookSplash.css';

type Phase = 'closed' | 'opening' | 'opened' | 'fading' | 'done';

export interface BookSplashProps {
  onComplete: () => void;
}

export default function BookSplash({ onComplete }: BookSplashProps) {
  const [phase, setPhase] = useState<Phase>('closed');

  useEffect(() => {
    // Sequence: show closed book → open cover → fill with parchment → fade out
    const t1 = setTimeout(() => setPhase('opening'), 400);   // brief pause, then open
    const t2 = setTimeout(() => setPhase('opened'),  2000);  // 400 + 1600ms transition
    const t3 = setTimeout(() => setPhase('fading'),  2700);  // parchment fill held 700ms
    const t4 = setTimeout(() => {
      sessionStorage.setItem('splash_played', '1');
      setPhase('done');
      onComplete();
    }, 3400);  // 700ms fade-out

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  const coverOpen = phase === 'opening' || phase === 'opened' || phase === 'fading';

  return (
    <div
      className={`bs-overlay bs-${phase}`}
      aria-hidden="true"
      role="presentation"
      data-testid="book-splash"
    >
      <div className="bs-scene">
        <div className="bs-book">

          {/* ── Inside page — revealed as cover swings open ── */}
          <div className="bs-inside">
            <div className="bs-inside-frame">
              <span className="bs-corner-gem tl" aria-hidden="true">✦</span>
              <span className="bs-corner-gem tr" aria-hidden="true">✦</span>
              <span className="bs-corner-gem bl" aria-hidden="true">✦</span>
              <span className="bs-corner-gem br" aria-hidden="true">✦</span>
              <p className="bs-inside-heb">הָדָר</p>
              <p className="bs-inside-welcome">Welcome</p>
            </div>
          </div>

          {/* ── Cover — navy, rotates open on Y axis ───────── */}
          <div
            className={`bs-cover${coverOpen ? ' bs-cover--open' : ''}`}
            data-testid="book-cover"
          >
            <div className="bs-cover-frame">
              <span className="bs-corner-gem tl" aria-hidden="true">✦</span>
              <span className="bs-corner-gem tr" aria-hidden="true">✦</span>
              <span className="bs-corner-gem bl" aria-hidden="true">✦</span>
              <span className="bs-corner-gem br" aria-hidden="true">✦</span>
              <p className="bs-cover-heb">הָדָר</p>
              <h1 className="bs-cover-name">Hadar</h1>
              <p className="bs-cover-sub">Jewish Classical Academy</p>
              <div className="bs-cover-rule" aria-hidden="true" />
              <p className="bs-cover-tagline">Living Portfolio</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
