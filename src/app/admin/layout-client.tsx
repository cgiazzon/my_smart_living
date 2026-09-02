'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const navItems = [
  { href: '/admin',              label: 'Dashboard',      icon: '📊' },
  { href: '/admin/importar',     label: 'Importar CSV',   icon: '📥' },
  { href: '/admin/configuracoes',label: 'Configurações',  icon: '⚙️' },
]

export default function AdminLayoutClient({ children, user }: { children: React.ReactNode; user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  // Se a rota for a tela de login, renderiza apenas o formulário de login sem a barra lateral admin
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div style={{ padding: '0 1.5rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: 'var(--red)', width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🏢</div>
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2 }}>My Smart Living</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>Admin</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, paddingTop: '1rem' }}>
          {navItems.map(item => (
            <Link key={item.href} href={item.href}
              className={`admin-nav-item${pathname === item.href ? ' active' : ''}`}>
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.625rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.email || 'Usuário'}
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
            🚪 Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, background: 'var(--gray-100)', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
