import '../../globals.css'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <main style={{
      minHeight:      '100vh',
      background:     'var(--cream)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1rem',
    }}>
      <SignIn />
    </main>
  )
}
