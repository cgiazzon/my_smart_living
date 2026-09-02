import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-100)', padding: '2rem' }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '3rem' }}>🏢</span>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '0.75rem' }}>
          My Smart Living
        </h1>
        <p style={{ color: 'var(--gray-500)', marginBottom: '2rem', lineHeight: 1.6 }}>
          Plataforma de cadastro e gestão de investidores.<br />
          Acesse o formulário usando seu link individual ou entre no painel administrativo.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--navy)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9375rem' }}>
            🔐 Painel Admin
          </Link>
          <Link href="/cadastro" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'white', color: 'var(--navy)', border: '1.5px solid var(--navy)', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 700, textDecoration: 'none', fontSize: '0.9375rem' }}>
            📋 Formulário
          </Link>
        </div>
      </div>
    </main>
  )
}
