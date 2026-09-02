'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

const menuGroups = [
  {
    title: 'OPERAÇÃO E DISPAROS',
    items: [
      { href: '/admin/condominios', label: '1. Condomínios',     icon: '🏢' },
      { href: '/admin/importar',    label: '2. Importar Investidores', icon: '📥' },
      { href: '/admin/disparos',    label: '3. Hub de Disparos', icon: '🚀' },
    ]
  },
  {
    title: 'RELATÓRIOS E RESULTADOS',
    items: [
      { href: '/admin',             label: 'Dashboard & Fichas', icon: '📊' },
    ]
  },
  {
    title: 'SISTEMA',
    items: [
      { href: '/admin/configuracoes', label: 'Configurações',   icon: '⚙️' },
    ]
  }
]

export default function AdminLayoutClient({ children, user }: { children: React.ReactNode; user: User | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Fecha o menu mobile quando a rota muda
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Se a rota for a tela de login, renderiza apenas o formulário de login sem a barra lateral admin
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  return (
    <div className="admin-container">
      {/* Topbar Mobile */}
      <header className="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <img src="/logo.png" alt="My Smart Living" style={{ height: 32, width: 'auto', background: 'white', padding: '2px 5px', borderRadius: 4, objectFit: 'contain' }} />
          <span style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>My Smart Living</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-hamburger-btn"
          aria-label="Abrir Menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Overlay Escuro para Mobile */}
      {mobileMenuOpen && (
        <div
          className="mobile-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop + Drawer no Mobile) */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Header da Sidebar */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <img src="/logo.png" alt="My Smart Living" style={{ height: 38, width: 'auto', background: 'white', padding: '3px 6px', borderRadius: 6, objectFit: 'contain' }} />
            <div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2 }}>My Smart Living</div>
              <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>Painel Administrativo</div>
            </div>
          </div>
        </div>

        {/* Menu Grupos Organizados por Sequência */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {menuGroups.map(group => (
            <div key={group.title}>
              <div style={{ padding: '0 0.75rem 0.5rem', fontSize: '0.6875rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>
                {group.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {group.items.map(item => (
                  <Link key={item.href} href={item.href}
                    className={`admin-nav-item${pathname === item.href ? ' active' : ''}`}>
                    <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer com Perfil e Logout */}
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.15)' }}>
          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginBottom: '0.625rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            👤 {user?.email || 'Usuário'}
          </div>
          <button onClick={handleLogout} style={{ width: '100%', padding: '0.5rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}>
            🚪 Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        {children}
      </main>
    </div>
  )
}
