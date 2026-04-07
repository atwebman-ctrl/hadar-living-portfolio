'use client'

import Link from 'next/link'
import './portfolio.css'
import RevealObserver from '@/components/portfolio/RevealObserver'
import SideNav from '@/components/portfolio/SideNav'
import HeroSection from '@/components/portfolio/HeroSection'
import IntellectualArc from '@/components/portfolio/IntellectualArc'
import ImmersionEngine from '@/components/portfolio/ImmersionEngine'
import TheCanon from '@/components/portfolio/TheCanon'
import CreativeEvolution from '@/components/portfolio/CreativeEvolution'
import RhetoricRoom from '@/components/portfolio/RhetoricRoom'
import CharacterArc from '@/components/portfolio/CharacterArc'
import ScopeAndSequence from '@/components/portfolio/ScopeAndSequence'
import HandwritingSamples from '@/components/portfolio/HandwritingSamples'
import PhotoGallery from '@/components/portfolio/PhotoGallery'
import TeacherNotes from '@/components/portfolio/TeacherNotes'
import ParentUploads from '@/components/portfolio/ParentUploads'
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
      <div className="main">
        <HeroSection />
        <IntellectualArc />
        <ImmersionEngine />
        <TheCanon />
        <CreativeEvolution />
        <RhetoricRoom />
        <CharacterArc />
        <ScopeAndSequence />
        <HandwritingSamples />
        <PhotoGallery />
        <TeacherNotes />
        <ParentUploads />
        <PortfolioFooter />
      </div>
    </>
  )
}
