'use client'

import Link from 'next/link'
import './portfolio.css'
import layoutStyles from '@/components/portfolio/layout.module.css'
import RevealObserver from '@/components/portfolio/RevealObserver'
import SideNav from '@/components/portfolio/SideNav'
import HeroSection from '@/components/portfolio/HeroSection'
import TheCanon from '@/components/portfolio/TheCanon'
import MathSection from '@/components/portfolio/MathSection'
import EnglishSection from '@/components/portfolio/EnglishSection'
import HebrewSection from '@/components/portfolio/HebrewSection'
import CompositionView from '@/components/portfolio/CompositionView'
import CharacterArc from '@/components/portfolio/CharacterArc'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter'

export default function DemoPortfolio() {
  return (
    <>
      <RevealObserver />
      <Link
        href="/"
        style={{
          position: 'fixed',
          top: '1rem',
          right: '1.5rem',
          zIndex: 200,
          fontFamily: 'DM Mono, monospace',
          fontSize: '9px',
          letterSpacing: '.14em',
          textTransform: 'uppercase',
          color: 'var(--navy)',
          border: '1px solid var(--navy)',
          padding: '6px 14px',
          background: 'rgba(247,244,238,.9)',
          textDecoration: 'none',
          backdropFilter: 'blur(4px)',
        }}
      >
        ← Return Home
      </Link>
      <SideNav />
      <div className={layoutStyles.main}>
        <HeroSection />
        <TheCanon />
        <MathSection selectedYear="all" />
        <EnglishSection selectedYear="all" />
        <HebrewSection />
        <CompositionView writingSamples={[]} handwritingSamples={[]} studentId="" role="parent" />
        <CharacterArc />
        <PortfolioFooter />
      </div>
    </>
  )
}
