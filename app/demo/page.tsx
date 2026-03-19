'use client'

import { useEffect } from 'react'
import './portfolio.css'
import SideNav from '@/components/portfolio/SideNav'
import HeroSection from '@/components/portfolio/HeroSection'
import IntellectualArc from '@/components/portfolio/IntellectualArc'
import ImmersionEngine from '@/components/portfolio/ImmersionEngine'
import TheCanon from '@/components/portfolio/TheCanon'
import CreativeEvolution from '@/components/portfolio/CreativeEvolution'
import RhetoricRoom from '@/components/portfolio/RhetoricRoom'
import CharacterArc from '@/components/portfolio/CharacterArc'
import PortfolioFooter from '@/components/portfolio/PortfolioFooter'

export default function DemoPage() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08 }
    )
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <SideNav />
      <div className="main">
        <HeroSection />
        <IntellectualArc />
        <ImmersionEngine />
        <TheCanon />
        <CreativeEvolution />
        <RhetoricRoom />
        <CharacterArc />
        <PortfolioFooter />
      </div>
    </>
  )
}
