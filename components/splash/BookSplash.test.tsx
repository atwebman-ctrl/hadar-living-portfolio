// @vitest-environment jsdom
// ============================================================
// components/splash/BookSplash.test.tsx
// Unit tests for the BookSplash animation component.
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import BookSplash from './BookSplash';

// CSS import is a no-op in jsdom — suppress the warning
vi.mock('./BookSplash.css', () => ({}));

describe('BookSplash', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    sessionStorage.clear();
  });

  it('renders the overlay on mount', () => {
    const onComplete = vi.fn();
    render(<BookSplash onComplete={onComplete} />);
    expect(screen.getByTestId('book-splash')).toBeTruthy();
  });

  it('shows closed cover initially (no --open class)', () => {
    render(<BookSplash onComplete={vi.fn()} />);
    const cover = screen.getByTestId('book-cover');
    expect(cover.className).not.toContain('bs-cover--open');
  });

  it('applies --open class after 400 ms', () => {
    render(<BookSplash onComplete={vi.fn()} />);
    act(() => { vi.advanceTimersByTime(400); });
    const cover = screen.getByTestId('book-cover');
    expect(cover.className).toContain('bs-cover--open');
  });

  it('applies bs-opened overlay class after 2000 ms', () => {
    render(<BookSplash onComplete={vi.fn()} />);
    act(() => { vi.advanceTimersByTime(2000); });
    const overlay = screen.getByTestId('book-splash');
    expect(overlay.className).toContain('bs-opened');
  });

  it('applies bs-fading overlay class after 2700 ms', () => {
    render(<BookSplash onComplete={vi.fn()} />);
    act(() => { vi.advanceTimersByTime(2700); });
    const overlay = screen.getByTestId('book-splash');
    expect(overlay.className).toContain('bs-fading');
  });

  it('calls onComplete and removes component after full sequence', () => {
    const onComplete = vi.fn();
    const { container } = render(<BookSplash onComplete={onComplete} />);

    act(() => { vi.advanceTimersByTime(3400); });

    expect(onComplete).toHaveBeenCalledOnce();
    // Component renders null when done
    expect(container.firstChild).toBeNull();
  });

  it('sets sessionStorage splash_played flag on completion', () => {
    render(<BookSplash onComplete={vi.fn()} />);
    act(() => { vi.advanceTimersByTime(3400); });
    expect(sessionStorage.getItem('splash_played')).toBe('1');
  });

  it('cleans up timers on unmount', () => {
    const onComplete = vi.fn();
    const { unmount } = render(<BookSplash onComplete={onComplete} />);
    unmount();
    // Advance past all timeouts — onComplete should NOT fire
    act(() => { vi.advanceTimersByTime(5000); });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('displays school name on the cover', () => {
    render(<BookSplash onComplete={vi.fn()} />);
    // h1 is inside aria-hidden overlay — query with hidden:true
    const heading = screen.getByRole('heading', { level: 1, hidden: true });
    expect(heading.textContent).toBe('Hadar');
  });
});
