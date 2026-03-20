import Link from "next/link";
import './page.css';

export default function Home() {
  return (
    <>
      <div className="illuminated-bar" />
      <div className="lp-page">

        {/* ══ LEFT — LAPIS MANUSCRIPT PANEL ══ */}
        <div className="lp-left">
          <div className="ms-frame" />
          <span className="lp-corner tl">✦</span>
          <span className="lp-corner tr">✦</span>
          <span className="lp-corner bl">✦</span>
          <span className="lp-corner br">✦</span>

          <img src="/images/corner-ornament.png" width={120} alt="" aria-hidden="true"
            style={{ position: 'absolute', top: 8, left: 8, opacity: 0.85, zIndex: 3, transform: 'rotate(0deg)' }} />
          <img src="/images/corner-ornament.png" width={120} alt="" aria-hidden="true"
            style={{ position: 'absolute', top: 8, right: 8, opacity: 0.85, zIndex: 3, transform: 'rotate(90deg)' }} />
          <img src="/images/corner-ornament.png" width={120} alt="" aria-hidden="true"
            style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.85, zIndex: 3, transform: 'rotate(180deg)' }} />
          <img src="/images/corner-ornament.png" width={120} alt="" aria-hidden="true"
            style={{ position: 'absolute', bottom: 8, left: 8, opacity: 0.85, zIndex: 3, transform: 'rotate(270deg)' }} />

          <div className="left-inner">
            {/* Top: crest + school name */}
            <div className="brand-group">
              <h1 className="school-name">Hadar</h1>
              <div className="school-sub">Jewish Classical Academy</div>
            </div>

            {/* Middle: illustration — takes ~50% of vertical space */}
            <img src="/images/kid.png" className="left-illustration" alt="Hadar student" />

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
          <div className="portal-eyebrow" style={{ position: 'relative', zIndex: 1 }}>Living Portfolio · Parent Access</div>
          <h2 className="portal-title" style={{ position: 'relative', zIndex: 1 }}><span className="portal-title-plain">Your child&apos;s</span><br /><em>learning story</em></h2>
          <p className="portal-sub" style={{ position: 'relative', zIndex: 1 }}>
            An interactive portrait of your student&apos;s intellectual, linguistic, and moral
            development — updated each semester.
          </p>

          <div className="signin-card" style={{ position: 'relative', zIndex: 1 }}>
            <span className="card-corner tl">✦</span>
            <span className="card-corner tr">✦</span>
            <span className="card-corner bl">✦</span>
            <span className="card-corner br">✦</span>

            <div className="input-group">
              <label className="input-label">Email address</label>
              <input type="email" className="input-field" placeholder="your@email.com" />
            </div>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input type="password" className="input-field" placeholder="············" />
            </div>

            <button className="signin-btn">
              <span className="btn-corner tl">✦</span>
              <span className="btn-corner tr">✦</span>
              <span className="btn-corner bl">✦</span>
              <span className="btn-corner br">✦</span>
              Enter the Portfolio
            </button>

            <div className="signin-divider">
              <div className="signin-divider-line" />
              <div className="signin-divider-text">or</div>
              <div className="signin-divider-line" />
            </div>

            <Link href="/demo" className="demo-btn">
              View sample portfolio — Athena L.
            </Link>

            <div className="signin-footer">
              First time? <a href="#">Request access</a> &nbsp;·&nbsp; <a href="#">Forgot password</a>
            </div>
          </div>

          <div className="pull-quote" style={{ position: 'relative', zIndex: 1 }}>
            <span className="heb-mark">תּוֹרָה</span>
            <blockquote>Wisdom begins with wonder — and wonder begins here.</blockquote>
            <cite>Hadar Jewish Classical Academy · Torah Im Derech Eretz</cite>
          </div>

          {/* Deckled spine shadow — positioned absolute, no animation */}
          <div className="book-edge" aria-hidden="true" />
        </div>

      </div>
    </>
  );
}
