'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildInvestidorLink, statusLabel, formatDate } from '@/lib/utils'

type Investidor = {
  id: string
  token_unico: string
  nome: string
  email: string
  whatsapp: string
  apto: string
  status_envio: string
  abriu_link_at: string | null
  lembrete_enviado_at: string | null
  condominios: { nome: string } | null
}

export default function AdminPage() {
  const supabase = createClient()
  const [investidores, setInvestidores] = useState<Investidor[]>([])
  const [condominios, setCondominios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCond, setFilterCond] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('investidores')
      .select('*, condominios(nome)')
      .order('token_unico')
    const inv = (data || []) as Investidor[]
    setInvestidores(inv)
    const conds = [...new Set(inv.map(i => i.condominios?.nome).filter(Boolean))] as string[]
    setCondominios(conds)
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  const filtered = investidores.filter(inv => {
    if (filterCond && inv.condominios?.nome !== filterCond) return false
    if (filterStatus && inv.status_envio !== filterStatus) return false
    if (search && !inv.nome.toLowerCase().includes(search.toLowerCase()) && !inv.token_unico.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const kpis = {
    total: investidores.length,
    respondeu: investidores.filter(i => i.status_envio === 'respondeu').length,
    pendente: investidores.filter(i => i.status_envio === 'pendente').length,
    abriuLink: investidores.filter(i => i.status_envio === 'abriu_link').length,
    enviado: investidores.filter(i => i.status_envio === 'enviado').length,
  }
  const pct = kpis.total > 0 ? Math.round((kpis.respondeu / kpis.total) * 100) : 0

  const copyLink = (token: string) => {
    navigator.clipboard.writeText(buildInvestidorLink(token, process.env.NEXT_PUBLIC_APP_URL))
    setCopied(token)
    setTimeout(() => setCopied(null), 2000)
  }

  const exportCsv = () => {
    const header = ['Token', 'Nome', 'Email', 'WhatsApp', 'Condomínio', 'Apto', 'Status', 'Abriu Link', 'Lembrete Enviado']
    const rows = investidores.map(i => [
      i.token_unico, i.nome, i.email, i.whatsapp,
      i.condominios?.nome || '', i.apto, i.status_envio,
      i.abriu_link_at ? formatDate(i.abriu_link_at) : '',
      i.lembrete_enviado_at ? formatDate(i.lembrete_enviado_at) : ''
    ])
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'investidores_msl.csv'; a.click()
  }

  const sendReminder = async (inv: Investidor) => {
    const res = await fetch('/api/lembrete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investidor_id: inv.id }),
    })
    if (res.ok) { alert(`Lembrete enviado para ${inv.nome}`); load() }
    else alert('Erro ao enviar lembrete.')
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>Dashboard</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Acompanhamento de cadastros — My Smart Living</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary">
          📤 Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="kpi-card">
          <div className="kpi-value">{pct}%</div>
          <div className="kpi-label">Taxa de resposta</div>
          <div style={{ marginTop: '0.75rem', height: 4, background: 'var(--gray-200)', borderRadius: 99 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--navy)', borderRadius: 99, transition: 'width 0.5s' }} />
          </div>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #10B981' }}>
          <div className="kpi-value" style={{ color: '#059669' }}>{kpis.respondeu}</div>
          <div className="kpi-label">✅ Responderam</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #6B7280' }}>
          <div className="kpi-value" style={{ color: '#4B5563' }}>{kpis.pendente}</div>
          <div className="kpi-label">⏳ Pendentes</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #3B82F6' }}>
          <div className="kpi-value" style={{ color: '#2563EB' }}>{kpis.abriuLink}</div>
          <div className="kpi-label">👁️ Abriram o link</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '3px solid #F59E0B' }}>
          <div className="kpi-value" style={{ color: '#D97706' }}>{kpis.enviado}</div>
          <div className="kpi-label">📧 Enviados</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-value">{kpis.total}</div>
          <div className="kpi-label">Total de investidores</div>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--gray-200)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="filter-bar">
          <input
            style={{ flex: '1 1 200px', padding: '0.5rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: '0.875rem', outline: 'none' }}
            placeholder="🔍 Buscar por nome ou token..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
          <select className="filter-select" value={filterCond} onChange={e => setFilterCond(e.target.value)}>
            <option value="">Todos os condomínios</option>
            {condominios.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="respondeu">✅ Respondeu</option>
            <option value="abriu_link">👁️ Abriu o Link</option>
            <option value="enviado">📧 Enviado</option>
            <option value="pendente">⏳ Pendente</option>
          </select>
          {(filterCond || filterStatus || search) && (
            <button className="btn-secondary" onClick={() => { setFilterCond(''); setFilterStatus(''); setSearch('') }}>
              ✕ Limpar
            </button>
          )}
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginLeft: 'auto' }}>{filtered.length} de {kpis.total}</span>
        </div>
      </div>

      {/* Tabela */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>Carregando...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Nome</th>
                  <th>Condomínio</th>
                  <th>Apto</th>
                  <th>Status</th>
                  <th>Abriu Link</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const s = statusLabel(inv.status_envio)
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', fontSize: '0.8rem' }}>{inv.token_unico}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{inv.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 400 }}>{inv.email}</div>
                      </td>
                      <td>{inv.condominios?.nome || '—'}</td>
                      <td>{inv.apto}</td>
                      <td>
                        <span className="status-badge" style={{ background: s.color.includes('emerald') ? 'rgba(16,185,129,0.1)' : s.color.includes('blue') ? 'rgba(59,130,246,0.1)' : s.color.includes('orange') ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)', color: s.color.includes('emerald') ? '#059669' : s.color.includes('blue') ? '#2563EB' : s.color.includes('orange') ? '#D97706' : '#6B7280', borderColor: s.color.includes('emerald') ? 'rgba(16,185,129,0.3)' : s.color.includes('blue') ? 'rgba(59,130,246,0.3)' : s.color.includes('orange') ? 'rgba(245,158,11,0.3)' : 'rgba(107,114,128,0.3)' }}>
                          {s.emoji} {s.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{formatDate(inv.abriu_link_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => copyLink(inv.token_unico)} className="btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
                            {copied === inv.token_unico ? '✅' : '🔗'} {copied === inv.token_unico ? 'Copiado!' : 'Link'}
                          </button>
                          {inv.status_envio !== 'respondeu' && (
                            <button onClick={() => sendReminder(inv)} className="btn-secondary" style={{ padding: '0.375rem 0.625rem', fontSize: '0.75rem' }}>
                              📧 Lembrete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--gray-500)' }}>Nenhum investidor encontrado.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
