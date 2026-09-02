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
  condominios: { nome: string; subtitulo_administracao: string } | null
}

export default function DisparosPage() {
  const supabase = createClient()
  const [investidores, setInvestidores] = useState<Investidor[]>([])
  const [condominios, setCondominios] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCond, setFilterCond] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch] = useState('')

  // Seleção para disparo por E-mail
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [sendingMassa, setSendingMassa] = useState(false)
  const [massaResult, setMassaResult] = useState<{ enviados: number; erros: number } | null>(null)
  const [sendingSingleId, setSendingSingleId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('investidores')
      .select('*, condominios(nome, subtitulo_administracao)')
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

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(i => i.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  // Disparo em massa por E-mail
  const handleDisparoMassa = async () => {
    if (selectedIds.length === 0) return
    if (!confirm(`Confirma o disparo de e-mails para ${selectedIds.length} investidores selecionados?`)) return

    setSendingMassa(true)
    setMassaResult(null)

    const res = await fetch('/api/disparo-massa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investidor_ids: selectedIds }),
    })

    const data = await res.json()
    setSendingMassa(false)

    if (res.ok) {
      setMassaResult({ enviados: data.enviados, erros: data.erros })
      setSelectedIds([])
      load()
    } else {
      alert(`Erro no disparo de e-mails: ${data.error}`)
    }
  }

  // Disparo individual por E-mail
  const handleDisparoIndividual = async (inv: Investidor) => {
    setSendingSingleId(inv.id)

    const res = await fetch('/api/disparo-massa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ investidor_ids: [inv.id] }),
    })

    setSendingSingleId(null)

    if (res.ok) {
      alert(`E-mail enviado com sucesso para ${inv.nome}!`)
      load()
    } else {
      alert(`Erro ao enviar e-mail para ${inv.nome}`)
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>Hub de Disparos por E-mail</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Gerencie e execute o envio de pesquisas por E-mail (em massa ou individual).</p>
        </div>
      </div>

      {/* Resultado do disparo de e-mails */}
      {massaResult && (
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '1.5rem' }}>✉️</span>
          <div>
            <div style={{ fontWeight: 700, color: '#15803D' }}>Envio de e-mails concluído!</div>
            <div style={{ fontSize: '0.875rem', color: '#166534' }}>{massaResult.enviados} e-mails enviados com sucesso{massaResult.erros > 0 ? ` • ${massaResult.erros} falhas` : ''}</div>
          </div>
          <button onClick={() => setMassaResult(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}>✕</button>
        </div>
      )}

      {/* Barra de Filtros e Ações de Disparo por E-mail */}
      <div style={{ background: 'white', borderRadius: 12, padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--gray-200)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
            <input
              style={{ flex: '1 1 200px', padding: '0.5rem 0.75rem', border: '1.5px solid var(--gray-200)', borderRadius: 8, fontSize: '0.875rem', outline: 'none' }}
              placeholder="🔍 Buscar investidor ou token..."
              value={search} onChange={e => setSearch(e.target.value)}
            />
            <select className="filter-select" value={filterCond} onChange={e => setFilterCond(e.target.value)}>
              <option value="">Todos os condomínios</option>
              {condominios.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="pendente">⏳ Pendente</option>
              <option value="enviado">📧 Enviado</option>
              <option value="abriu_link">👁️ Abriu o Link</option>
              <option value="respondeu">✅ Respondeu</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              onClick={handleDisparoMassa}
              disabled={selectedIds.length === 0 || sendingMassa}
              className="btn-primary"
              style={{ width: 'auto', padding: '0.625rem 1.25rem', fontSize: '0.875rem', background: selectedIds.length > 0 ? 'var(--navy)' : 'var(--gray-500)' }}
            >
              {sendingMassa ? 'Enviando e-mails...' : `✉️ Disparar E-mails em Massa (${selectedIds.length})`}
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Disparos por E-mail */}
      <div style={{ background: 'white', borderRadius: 12, border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>Carregando lista de investidores...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" checked={filtered.length > 0 && selectedIds.length === filtered.length} onChange={toggleSelectAll} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                  </th>
                  <th>Token</th>
                  <th>Investidor</th>
                  <th>Condomínio / Unidade</th>
                  <th>Status de Envio</th>
                  <th>Último Envio</th>
                  <th>Ações de E-mail</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const s = statusLabel(inv.status_envio)
                  const isSelected = selectedIds.includes(inv.id)
                  const isSendingThis = sendingSingleId === inv.id

                  return (
                    <tr key={inv.id} style={{ background: isSelected ? 'rgba(27,58,107,0.04)' : undefined }}>
                      <td>
                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(inv.id)} style={{ width: 16, height: 16, cursor: 'pointer' }} />
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', fontSize: '0.8rem' }}>{inv.token_unico}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{inv.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 400 }}>{inv.email}</div>
                      </td>
                      <td>
                        <div>{inv.condominios?.nome || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Apto {inv.apto}</div>
                      </td>
                      <td>
                        <span className="status-badge" style={{ background: s.color.includes('emerald') ? 'rgba(16,185,129,0.1)' : s.color.includes('blue') ? 'rgba(59,130,246,0.1)' : s.color.includes('orange') ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)', color: s.color.includes('emerald') ? '#059669' : s.color.includes('blue') ? '#2563EB' : s.color.includes('orange') ? '#D97706' : '#6B7280', borderColor: s.color.includes('emerald') ? 'rgba(16,185,129,0.3)' : s.color.includes('blue') ? 'rgba(59,130,246,0.3)' : s.color.includes('orange') ? 'rgba(245,158,11,0.3)' : 'rgba(107,114,128,0.3)' }}>
                          {s.emoji} {s.label}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                        {formatDate(inv.lembrete_enviado_at)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleDisparoIndividual(inv)}
                          disabled={isSendingThis}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                        >
                          {isSendingThis ? 'Enviando...' : '✉️ Enviar E-mail'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
