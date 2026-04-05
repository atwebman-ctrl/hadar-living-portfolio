import Link from 'next/link'
import './globals.css'

export default function NotFound() {
  return (
    <main style={{
      minHeight:      '100vh',
      background:     'var(--cream)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1rem',
    }}>
      <div style={{
        background: 'var(--parchment)',
        border:     '1px solid var(--rule)',
        padding:    '2.5rem 3rem',
        maxWidth:   '28rem',
        width:      '100%',
        textAlign:  'center',
      }}>
        <header style={{
          background:    'var(--navy)',
          margin:        '-2.5rem -3rem 2rem',
          padding:       '1.25rem 2rem',
          borderBottom:  '2px solid var(--gold)',
        }}>
          <p style={{
            fontFamily:    'var(--font-mono)',
            fontSize:      '0.65rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color:         'var(--gold)',
            margin:        0,
          }}>
            404
          </p>
        </header>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize:   '1.5rem',
          color:      'var(--navy)',
          margin:     '0 0 0.75rem',
        }}>
          Page not found
        </h1>
        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize:   '0.9rem',
          color:      'var(--ink-light)',
          margin:     '0 0 1.75rem',
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link href="/" style={{
          fontFamily:    'var(--font-mono)',
          fontSize:      '0.65rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         'var(--gold)',
          textDecoration: 'none',
        }}>
          ← Return home
        </Link>
      </div>
    </main>
  )
}
