import styles from '@/components/portfolio/layout.module.css'

type Props = {
  schoolName: string
  /** Optional school motto/tagline. Currently no DB column; passed only by the demo. */
  tagline?: string
}

export default function PortfolioFooter({ schoolName, tagline }: Props) {
  return (
    <div className={styles.portfolioFooter}>
      <div className={styles.footerLeft}>
        {schoolName} · Student Living Portfolio · Confidential
      </div>
      {tagline && <div className={styles.footerRight}>{tagline}</div>}
    </div>
  )
}
