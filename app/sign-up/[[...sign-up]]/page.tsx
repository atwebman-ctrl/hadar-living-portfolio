import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main style={{
      minHeight:      '100vh',
      background:     'var(--cream)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '2rem 1rem',
    }}>
      <SignUp />
    </main>
  )
}
