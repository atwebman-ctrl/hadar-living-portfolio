'use client';

// ============================================================
// app/LandingShell.tsx
// Client wrapper that manages the BookSplash lifecycle.
// Checks sessionStorage once on mount — skips animation on
// repeat visits within the same browser session.
// ============================================================

import { useState, useEffect, type ReactNode } from 'react';
import BookSplash from '@/components/splash/BookSplash';

export default function LandingShell({ children }: { children: ReactNode }) {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem('splash_played')) {
      setShowSplash(true);
    }
  }, []);

  return (
    <>
      {showSplash && (
        <BookSplash onComplete={() => setShowSplash(false)} />
      )}
      {children}
    </>
  );
}
