import Link from "next/link";

export default function Home() {
  return (
    <>
      <style>{`
        :root{--lapis:#1E3A5F;--lapis-deep:#152A47;--lapis-mid:#2A5298;--gold:#C49A2A;--gold-metal:#C49A2A;--gold-light:#D4AF6A;--gold-pale:#EDD99A;--gold-bright:#F0C84A;--crimson:#8B2635;--forest:#3A5C38;--parchment:#F2E8CC;--parch-mid:#E8DDB8;--ink:#1E1608;--ink-mid:#4A3C28;--ink-light:#7A6A50;--ink-faint:#A89878}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .lp-page{min-height:100vh;display:grid;grid-template-columns:1fr 1fr}
        .lp-left{background:var(--lapis-deep);display:flex;flex-direction:column;justify-content:center;align-items:center;position:relative;overflow:hidden;min-height:100vh}
        .lp-left::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 40%,rgba(196,154,42,.07) 0%,transparent 60%),radial-gradient(ellipse at 20% 80%,rgba(196,154,42,.03) 0%,transparent 45%);pointer-events:none}
        .ms-frame{position:absolute;inset:18px;pointer-events:none}
        .ms-frame::before{content:'';position:absolute;inset:0;border:1.5px solid rgba(196,154,42,.45)}
        .ms-frame::after{content:'';position:absolute;inset:9px;border:1px solid rgba(196,154,42,.2)}
        .lp-corner{position:absolute;font-size:11px;color:var(--gold);opacity:.8;z-index:2;line-height:1}
        .lp-corner.tl{top:11px;left:12px}.lp-corner.tr{top:11px;right:12px}.lp-corner.bl{bottom:11px;left:12px}.lp-corner.br{bottom:11px;right:12px}
        .vine{position:absolute;opacity:.25;pointer-events:none}
        .left-inner{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;text-align:center;padding:4rem;width:100%;gap:0}
        .left-inner>*{animation:fadeUp .9s ease both}
        .left-inner>*:nth-child(1){animation-delay:.08s}.left-inner>*:nth-child(2){animation-delay:.18s}.left-inner>*:nth-child(3){animation-delay:.26s}.left-inner>*:nth-child(4){animation-delay:.34s}.left-inner>*:nth-child(5){animation-delay:.4s}.left-inner>*:nth-child(6){animation-delay:.46s}.left-inner>*:nth-child(7){animation-delay:.52s}.left-inner>*:nth-child(8){animation-delay:.58s}
        .orule{display:flex;align-items:center;gap:8px;width:100%;margin-bottom:1.5rem}
        .orule-line{flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(196,154,42,.55),transparent)}
        .orule-center{display:flex;align-items:center;gap:5px}
        .odot{width:4px;height:4px;border-radius:50%;background:var(--gold);opacity:.65}
        .odiamond{width:7px;height:7px;background:var(--gold);opacity:.75;transform:rotate(45deg)}

        .school-name{font-family:'Playfair Display',serif;font-size:4.2rem;font-weight:500;color:var(--gold-pale);line-height:.88;margin-bottom:.45rem}
        .school-sub{font-family:'Cormorant Garamond',serif;font-size:.9rem;font-weight:300;letter-spacing:.32em;text-transform:uppercase;color:rgba(196,154,42,.5);margin-top:-.2rem;margin-bottom:1rem}
        .ms-text-block{border:1px solid rgba(196,154,42,.28);border-top:2.5px solid rgba(196,154,42,.65);padding:1.1rem 1.5rem 1.15rem;max-width:310px;background:rgba(196,154,42,.04);position:relative;margin-bottom:1.6rem}
        .ms-text-block::before{content:'';position:absolute;top:4px;left:1.2rem;right:1.2rem;height:1px;background:var(--gold);opacity:.25}
        .ms-text{font-size:.93rem;line-height:1.85;color:rgba(220,185,110,.68);font-style:italic;font-weight:300}
        .dropcap{float:left;font-family:'Playfair Display',serif;font-size:2.8rem;line-height:.82;color:var(--gold);opacity:.9;margin:.05rem .22rem 0 0;font-style:normal}
        .colophon{display:flex;align-items:center;gap:12px;width:100%;max-width:300px}
        .colophon-line{flex:1;height:1px;background:linear-gradient(to right,transparent,rgba(196,154,42,.45),transparent)}
        .colophon-text{font-family:'DM Mono',monospace;font-size:11px;font-weight:500;letter-spacing:.16em;color:rgba(225,200,130,.9);text-transform:uppercase;white-space:nowrap}
        .lp-right{position:relative;display:flex;flex-direction:column;justify-content:center;align-items:center;padding:4rem;background-color:var(--parchment);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E"),radial-gradient(ellipse at 8% 12%,rgba(160,120,50,.09) 0%,transparent 35%),radial-gradient(ellipse at 92% 88%,rgba(140,100,40,.08) 0%,transparent 35%),radial-gradient(ellipse at 75% 15%,rgba(180,140,60,.06) 0%,transparent 30%),radial-gradient(ellipse at 25% 85%,rgba(130,100,40,.07) 0%,transparent 30%),radial-gradient(ellipse at 50% 50%,rgba(245,235,200,.5) 0%,transparent 70%)}
        .lp-right::before{content:'';position:absolute;top:0;bottom:0;left:0;width:6px;background:linear-gradient(to bottom,var(--lapis-deep) 0%,rgba(196,154,42,.3) 15%,var(--gold) 35%,var(--gold-bright) 50%,var(--gold) 65%,rgba(196,154,42,.3) 85%,var(--lapis-deep) 100%);filter:blur(0.5px)}
        .lp-right::after{content:'';position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(to right,var(--lapis-deep) 0%,rgba(196,154,42,.4) 20%,var(--gold) 40%,var(--gold-bright) 50%,var(--gold) 60%,rgba(196,154,42,.4) 80%,var(--lapis-deep) 100%);opacity:.8}
        .lp-right>*{animation:fadeUp .9s ease both}
        .lp-right>*:nth-child(1){animation-delay:.42s}.lp-right>*:nth-child(2){animation-delay:.5s}.lp-right>*:nth-child(3){animation-delay:.56s}.lp-right>*:nth-child(4){animation-delay:.62s}.lp-right>*:nth-child(5){animation-delay:.7s}
        .portal-eyebrow{font-family:'DM Mono',monospace;font-size:9px;letter-spacing:.22em;color:var(--ink-faint);text-transform:uppercase;margin-bottom:1.25rem;text-align:center;display:flex;align-items:center;gap:10px;width:100%;max-width:390px}
        .portal-eyebrow::before,.portal-eyebrow::after{content:'';flex:1;height:1px;background:rgba(120,90,30,.25)}
        .portal-title{font-family:'Playfair Display',serif;font-size:2.15rem;font-weight:400;color:var(--ink);line-height:1.15;text-align:center;margin-bottom:.6rem;max-width:340px}
        .portal-title em{font-style:italic;color:var(--lapis)}
        .portal-sub{font-family:'Cormorant Garamond',serif;font-size:.98rem;color:var(--ink-light);text-align:center;line-height:1.8;max-width:295px;margin:0 auto 0;margin-bottom:3rem;font-weight:300;font-style:italic}
        .signin-card{width:100%;max-width:375px;background:var(--parch-mid);border:1px solid rgba(120,90,30,.35);border-top:2.5px solid var(--gold-metal);padding:2.1rem 2.1rem 1.8rem;position:relative;box-shadow:inset 0 1px 4px rgba(80,60,20,.1),inset 0 -1px 3px rgba(80,60,20,.07),0 3px 10px rgba(30,22,8,.1),0 10px 32px rgba(30,22,8,.08),0 1px 0 rgba(196,154,42,.35)}
        .signin-card::before{content:'';position:absolute;top:8px;left:1rem;right:1rem;height:1px;background:rgba(196,154,42,.22)}
        .card-corner{position:absolute;font-size:9px;color:var(--gold);opacity:.6;font-family:'Playfair Display',serif}
        .card-corner.tl{top:5px;left:8px}.card-corner.tr{top:5px;right:8px}.card-corner.bl{bottom:7px;left:8px}.card-corner.br{bottom:7px;right:8px}
        .input-group{margin-bottom:1rem}
        .input-label{display:block;font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-light);margin-bottom:.4rem}
        .input-field{width:100%;padding:.68rem .9rem;background:rgba(225,205,165,.4);border:1px solid rgba(120,90,30,.25);border-bottom:1px solid rgba(120,90,30,.45);font-family:'Cormorant Garamond',serif;font-size:1rem;color:var(--ink);outline:none;border-radius:0;box-shadow:inset 0 2px 6px rgba(60,40,10,.1),inset 0 1px 0 rgba(255,255,255,.4);transition:border-color .2s,background .2s;-webkit-appearance:none}
        .input-field:focus{border-color:var(--gold);border-bottom-color:var(--gold);background:rgba(245,235,210,.6);box-shadow:inset 0 2px 4px rgba(60,40,10,.08),0 0 0 1px rgba(196,154,42,.3)}
        .input-field::placeholder{color:var(--ink-faint);font-style:italic}
        .signin-btn{width:100%;padding:1rem 1.5rem .95rem;background:transparent;border-top:2px solid var(--gold-metal);border-bottom:2px solid var(--gold-metal);border-left:1px solid rgba(196,154,42,.4);border-right:1px solid rgba(196,154,42,.4);font-family:'Cormorant Garamond',serif;font-size:1.05rem;font-style:italic;letter-spacing:.14em;color:var(--lapis-deep);cursor:pointer;margin-top:.5rem;position:relative;transition:all .25s;border-radius:0}
        .signin-btn::before,.signin-btn::after{content:'';position:absolute;left:12%;right:12%;height:1px;background:rgba(196,154,42,.3)}
        .signin-btn::before{top:4px}.signin-btn::after{bottom:4px}
        .btn-corner{position:absolute;font-size:7px;color:var(--gold);opacity:.55;font-style:normal}
        .btn-corner.tl{top:3px;left:5px}.btn-corner.tr{top:3px;right:5px}.btn-corner.bl{bottom:3px;left:5px}.btn-corner.br{bottom:3px;right:5px}
        .signin-btn:hover{background:rgba(196,154,42,.1);border-top-color:var(--lapis);border-bottom-color:var(--lapis);color:rgba(212,175,106,1);box-shadow:0 0 0 1px var(--gold)}
        .signin-btn:active{transform:scale(.99)}
        .signin-divider{display:flex;align-items:center;gap:.75rem;margin:1.25rem 0}
        .signin-divider-line{flex:1;height:1px;background:rgba(120,90,30,.18)}
        .signin-divider-text{font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.12em;color:var(--ink-faint);text-transform:uppercase}
        .demo-btn{display:block;width:100%;padding:.75rem 1.5rem;background:transparent;border:1px solid rgba(196,154,42,.5);font-family:'DM Mono',monospace;font-size:8px;letter-spacing:.15em;text-transform:uppercase;color:var(--ink-mid);cursor:pointer;border-radius:0;transition:all .2s;text-align:center;text-decoration:none}
        .demo-btn:hover{background:rgba(30,58,95,.05);border-color:var(--gold);color:var(--lapis)}
        .signin-footer{margin-top:1.1rem;text-align:center;font-family:'Cormorant Garamond',serif;font-size:.88rem;color:var(--ink-faint);font-style:italic}
        .signin-footer a{color:var(--lapis);text-decoration:none;border-bottom:1px solid rgba(30,58,95,.2);transition:border-color .2s}
        .signin-footer a:hover{border-color:var(--lapis)}
        .pull-quote{margin-top:2.25rem;max-width:340px;text-align:center}
        .pull-quote::before{content:'';display:block;width:36px;height:1px;background:rgba(120,90,30,.3);margin:0 auto 1.1rem}
        .heb-mark{display:block;font-size:1.35rem;color:var(--lapis);opacity:.3;margin-bottom:.45rem}
        .pull-quote blockquote{font-family:'Cormorant Garamond',serif;font-size:1rem;font-weight:300;color:var(--ink-mid);line-height:1.8;font-style:italic}
        .pull-quote cite{display:block;margin-top:.7rem;font-family:'DM Mono',monospace;font-size:7px;letter-spacing:.18em;color:var(--ink-faint);text-transform:uppercase;font-style:normal}
        .illuminated-bar{position:fixed;bottom:0;left:0;right:0;height:4px;z-index:100;background:linear-gradient(to right,var(--lapis-deep) 0%,rgba(196,154,42,.4) 20%,var(--gold) 40%,var(--gold-bright) 50%,var(--gold) 60%,rgba(196,154,42,.4) 80%,var(--lapis-deep) 100%);opacity:.8}
        .mobile-crest{display:none}
        @media(max-width:860px){
          .lp-page{grid-template-columns:1fr;grid-template-rows:auto auto}
          .lp-right{order:-1;padding:2.5rem 1.5rem 3rem}
          .lp-left{order:1;min-height:auto;padding:2rem 1.5rem}
          .lp-right::before{width:100%;height:4px;top:0;left:0;right:0;bottom:auto}
          .vine{display:none}
          .ms-frame{display:none}
          .lp-corner{display:none}
          .mobile-crest{display:block;width:80px;height:auto;opacity:.25;mix-blend-mode:multiply;margin:0 auto 1rem}
          .school-name{font-size:2.6rem}
          .portal-title{font-size:1.7rem}
          .signin-card{max-width:100%;padding:1.5rem}
        }
      `}</style>

      <div className="illuminated-bar" />
      <div className="lp-page">

        {/* ══ LEFT — LAPIS MANUSCRIPT PANEL ══ */}
        <div className="lp-left">
          <div className="ms-frame" />
          <span className="lp-corner tl">✦</span>
          <span className="lp-corner tr">✦</span>
          <span className="lp-corner bl">✦</span>
          <span className="lp-corner br">✦</span>

          {/* Left vine */}
          <svg className="vine" style={{ left: 30, top: 48, width: 16, height: "calc(100% - 96px)" }} viewBox="0 0 16 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0 Q13 55 8 110 Q3 165 8 220 Q13 275 8 330 Q3 370 8 400" stroke="#C49A2A" strokeWidth="1.2" fill="none"/>
            <circle cx="8" cy="65"  r="3.5" fill="#C49A2A"/>
            <circle cx="8" cy="155" r="3"   fill="#C49A2A"/>
            <circle cx="8" cy="240" r="3.5" fill="#C49A2A"/>
            <circle cx="8" cy="325" r="3"   fill="#C49A2A"/>
            <ellipse cx="3"  cy="90"  rx="4" ry="6" transform="rotate(-25 3 90)"   fill="#3A5C38"/>
            <ellipse cx="13" cy="180" rx="4" ry="6" transform="rotate(25 13 180)"  fill="#3A5C38"/>
            <ellipse cx="3"  cy="268" rx="4" ry="6" transform="rotate(-25 3 268)"  fill="#3A5C38"/>
            <ellipse cx="13" cy="355" rx="4" ry="6" transform="rotate(25 13 355)"  fill="#3A5C38"/>
          </svg>

          {/* Right vine */}
          <svg className="vine" style={{ right: 30, top: 48, width: 16, height: "calc(100% - 96px)" }} viewBox="0 0 16 400" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0 Q3 55 8 110 Q13 165 8 220 Q3 275 8 330 Q13 370 8 400" stroke="#C49A2A" strokeWidth="1.2" fill="none"/>
            <circle cx="8" cy="65"  r="3.5" fill="#C49A2A"/>
            <circle cx="8" cy="155" r="3"   fill="#C49A2A"/>
            <circle cx="8" cy="240" r="3.5" fill="#C49A2A"/>
            <circle cx="8" cy="325" r="3"   fill="#C49A2A"/>
            <ellipse cx="13" cy="90"  rx="4" ry="6" transform="rotate(25 13 90)"   fill="#3A5C38"/>
            <ellipse cx="3"  cy="180" rx="4" ry="6" transform="rotate(-25 3 180)"  fill="#3A5C38"/>
            <ellipse cx="13" cy="268" rx="4" ry="6" transform="rotate(25 13 268)"  fill="#3A5C38"/>
            <ellipse cx="3"  cy="355" rx="4" ry="6" transform="rotate(-25 3 355)"  fill="#3A5C38"/>
          </svg>

          <div className="left-inner">
            <div className="orule">
              <div className="orule-line" />
              <div className="orule-center">
                <div className="odot" /><div className="odiamond" /><div className="odot" />
              </div>
              <div className="orule-line" />
            </div>

            <img src="/images/crest.png" width={320} style={{ height: 'auto', mixBlendMode: 'lighten', marginBottom: '1.5rem' }} alt="Hadar crest" />

<h1 className="school-name">Hadar</h1>
            <div className="school-sub">Jewish Classical Academy</div>

            <div className="ms-text-block">
              <p className="ms-text">
                <span className="dropcap">ה</span>
                Every child is the protagonist of their own intellectual and moral development.
              </p>
            </div>

            <div className="colophon">
              <div className="colophon-line" />
              <div className="colophon-text">Founded 2022 · Austin, Texas</div>
              <div className="colophon-line" />
            </div>
          </div>
        </div>

        {/* ══ RIGHT — PARCHMENT PORTAL ══ */}
        <div className="lp-right">
          {/* Mobile-only watermark crest */}
          <img src="/images/crest.png" className="mobile-crest" alt="" aria-hidden="true" />
          <div className="portal-eyebrow">Living Portfolio · Parent Access</div>
          <h2 className="portal-title">Your child&apos;s<br /><em>learning story</em></h2>
          <p className="portal-sub">
            An interactive portrait of your student&apos;s intellectual, linguistic, and moral
            development — updated each semester.
          </p>

          <div className="signin-card">
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

          <div className="pull-quote">
            <span className="heb-mark">תּוֹרָה</span>
            <blockquote>Wisdom begins with wonder — and wonder begins here.</blockquote>
            <cite>Hadar Jewish Classical Academy · Torah Im Derech Eretz</cite>
          </div>
        </div>

      </div>
    </>
  );
}
