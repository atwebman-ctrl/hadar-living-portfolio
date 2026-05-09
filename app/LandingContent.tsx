'use client'

// ============================================================
// app/LandingContent.tsx
// Landing page markup — rendered inside LandingShell so the
// splash state is managed separately. 'use client' is required
// because the embedded Clerk <SignIn> component is client-only.
// ============================================================

import Link from 'next/link'
import Image from 'next/image'
import { SignIn } from '@clerk/nextjs'
import './styles/landing-layout.css'
import './styles/landing-left-panel.css'
import './styles/landing-right-panel.css'
import './styles/landing-mobile.css'

// Clerk appearance overrides — strip Clerk's own card chrome so
// the component sits cleanly inside our .signin-card wrapper.
const clerkAppearance = {
  elements: {
    rootBox:        { width: '100%' },
    card:           { boxShadow: 'none', background: 'transparent', border: 'none', padding: 0, margin: 0, gap: 0 },
    headerTitle:    { display: 'none' },
    headerSubtitle: { display: 'none' },
    header:         { display: 'none' },
    footer:         { display: 'none' },
    socialButtonsBlockButton: {
      border:      '1px solid var(--lapis)',
      background:  'transparent',
      color:       'var(--lapis)',
      borderRadius: 0,
    },
    formFieldLabel: {
      fontFamily:    "'DM Mono', monospace",
      fontSize:      '0.62rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase' as const,
      color:         'var(--lapis)',
    },
    formFieldInput: {
      background:  'rgba(255,255,255,0.07)',
      border:      '1px solid rgba(255,255,255,0.15)',
      borderRadius: 0,
      color:       '#fff',
      fontFamily:  "'EB Garamond', Georgia, serif",
      fontSize:    '0.95rem',
    },
    formButtonPrimary: {
      background:   'transparent',
      border:       '1px solid var(--gold)',
      borderRadius: 0,
      color:        'var(--gold)',
      fontFamily:   "'DM Mono', monospace",
      fontSize:     '0.65rem',
      letterSpacing:'0.12em',
      textTransform:'uppercase' as const,
      boxShadow:    'none',
    },
    dividerLine:   { background: 'rgba(255,255,255,0.15)' },
    dividerText:   { color: 'rgba(255,255,255,0.4)', fontFamily: "'DM Mono', monospace", fontSize: '0.6rem' },
    identityPreviewText:   { color: '#fff' },
    identityPreviewEditButton: { color: 'var(--gold)' },
    alternativeMethodsBlockButton: {
      border:       '1px solid rgba(255,255,255,0.2)',
      borderRadius: 0,
      color:        'rgba(255,255,255,0.75)',
    },
    formResendCodeLink: { color: 'var(--gold)' },
    otpCodeFieldInput: {
      border:       '1px solid rgba(255,255,255,0.2)',
      borderRadius: 0,
      color:        '#fff',
      background:   'rgba(255,255,255,0.07)',
    },
  },
}

export default function LandingContent() {
  return (
    <div className="lp-page">

      {/* ══ LEFT — LAPIS MANUSCRIPT PANEL ══ */}
      <div className="lp-left">
        <div className="ms-frame" />
        <span className="lp-corner tl">✦</span>
        <span className="lp-corner tr">✦</span>
        <span className="lp-corner bl">✦</span>
        <span className="lp-corner br">✦</span>

        <div className="lp-corner" style={{ top: 8, left: 8, zIndex: 3, opacity: 0.85, fontSize: 0 }}>
          <Image src="/images/corner-ornament.png" width={120} height={120} alt="" aria-hidden="true" style={{ transform: 'rotate(0deg)', display: 'block' }} />
        </div>
        <div className="lp-corner" style={{ top: 8, right: 8, zIndex: 3, opacity: 0.85, fontSize: 0 }}>
          <Image src="/images/corner-ornament.png" width={120} height={120} alt="" aria-hidden="true" style={{ transform: 'rotate(90deg)', display: 'block' }} />
        </div>
        <div className="lp-corner" style={{ bottom: 8, right: 8, zIndex: 3, opacity: 0.85, fontSize: 0 }}>
          <Image src="/images/corner-ornament.png" width={120} height={120} alt="" aria-hidden="true" style={{ transform: 'rotate(180deg)', display: 'block' }} />
        </div>
        <div className="lp-corner" style={{ bottom: 8, left: 8, zIndex: 3, opacity: 0.85, fontSize: 0 }}>
          <Image src="/images/corner-ornament.png" width={120} height={120} alt="" aria-hidden="true" style={{ transform: 'rotate(270deg)', display: 'block' }} />
        </div>

        <div className="left-inner">
          {/* Top: crest + school name */}
          <div className="brand-group">
            <h1 className="school-name">Hadar</h1>
            <div className="school-sub">Jewish Classical Academy</div>
          </div>

          {/* Middle: illustration — takes ~50% of vertical space */}
          <Image src="/images/kid.png" className="left-illustration" alt="Hadar student" width={600} height={600} />

          {/* Bottom: colophon anchored to foot */}
          <div className="colophon">
            <div className="colophon-line" />
            <div className="colophon-text">Founded 2022 · Austin, Texas</div>
            <div className="colophon-line" />
          </div>
        </div>
      </div>

      {/* ══ RIGHT — PARCHMENT PORTAL ══ */}
      <div className="lp-right">
        <a
          href="/dashboard"
          style={{
            position: 'absolute',
            top: '1.5rem',
            right: '2rem',
            zIndex: 2,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'var(--ink-faint)',
            textDecoration: 'none',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--navy)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--ink-faint)' }}
        >
          Teacher Sign In →
        </a>
        <div className="mobile-header">
          <h1>Hadar</h1>
          <p>Jewish Classical Academy</p>
        </div>
        <div className="portal-eyebrow" style={{ position: 'relative', zIndex: 1 }}>Living Portfolio · Parent Access</div>
        <h2 className="portal-title" style={{ position: 'relative', zIndex: 1 }}>
          <span className="portal-title-plain">Your child&apos;s</span><br /><em>learning story</em>
        </h2>
        <p className="portal-sub" style={{ position: 'relative', zIndex: 1 }}>
          An interactive portrait of your student&apos;s intellectual, linguistic, and moral
          development — updated each semester.
        </p>

        <div className="signin-card" style={{ position: 'relative', zIndex: 1 }}>
          <span className="card-corner tl">✦</span>
          <span className="card-corner tr">✦</span>
          <span className="card-corner bl">✦</span>
          <span className="card-corner br">✦</span>

          {/* Clerk sign-in — card chrome suppressed via appearance prop */}
          <SignIn
            routing="hash"
            appearance={clerkAppearance}
          />

          <div className="signin-divider">
            <div className="signin-divider-line" />
            <div className="signin-divider-text">or</div>
            <div className="signin-divider-line" />
          </div>

          <Link href="/demo" className="demo-btn">
            View sample portfolio — Athena L.
          </Link>
        </div>

        <div className="pull-quote" style={{ position: 'relative', zIndex: 1 }}>
          <blockquote dir="rtl">שֶׂכֶל אֵינוֹ חָכְמָה</blockquote>
          <cite>Thomas Sowell</cite>
        </div>

        {/* Deckled spine shadow — positioned absolute, no animation */}
        <div className="book-edge" aria-hidden="true" />
      </div>

    </div>
  )
}
