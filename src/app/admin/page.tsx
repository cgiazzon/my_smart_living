'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { buildInvestidorLink, statusLabel, formatDate } from '@/lib/utils'

type RespostaFull = {
  id: string
  nome_completo: string
  cpf_cnpj: string
  email: string
  whatsapp: string
  condominio: string
  bloco: string
  unidade: string
  qtd_unidades: string
  endereco_correspondencia: string
  cidade_uf: string
  cep: string
  coproprietario_nome: string
  coproprietario_cpf: string
  coproprietario_telefone: string
  pj_representante_nome: string
  pj_representante_cpf: string
  pj_representante_telefone: string
  interlocutor_nome: string
  interlocutor_telefone: string
  destinacao_unidade: string
  quem_administra: string
  quem_administra_qual: string
  como_mobiliar: string
  como_mobiliar_fornecedor: string
  mes_ano_pronta: string
  mes_ano_observacao: string
  quem_recebe_chaves: string
  procurador_nome_telefone: string
  pretende_obra: string
  pretende_obra_qual: string
  propostas_apoio: string[]
  campo_sinalizar: string
  quer_ligacao: string
  melhor_dia_horario: string
  lgpd_consentido: boolean
  autoriza_contato: boolean
  assinatura_timestamp: string
  created_at: string
}

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
  respostas?: RespostaFull[]
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

  // Modal de detalhes
  const [selectedResp, setSelectedResp] = useState<RespostaFull | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('investidores')
      .select('*, condominios(nome), respostas(*)')
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
    const header = [
      'Token', 'Nome', 'CPF/CNPJ', 'Email', 'WhatsApp', 'Condomínio', 'Unidade', 'Status',
      'Destinação', 'Quem Administra', 'Como Mobiliar', 'Mês Pronta', 'Quem Recebe Chaves',
      'Pretende Obra', 'Apoio/Propostas', 'Campo Sinalizar', 'Quer Ligação', 'Data Resposta'
    ]
    const rows = investidores.map(i => {
      const resp = i.respostas && i.respostas.length > 0 ? i.respostas[0] : null
      return [
        i.token_unico,
        resp?.nome_completo || i.nome,
        resp?.cpf_cnpj || '',
        resp?.email || i.email,
        resp?.whatsapp || i.whatsapp,
        i.condominios?.nome || '',
        i.apto,
        i.status_envio,
        resp?.destinacao_unidade || '',
        resp?.quem_administra || '',
        resp?.como_mobiliar || '',
        resp?.mes_ano_pronta || '',
        resp?.quem_recebe_chaves || '',
        resp?.pretende_obra || '',
        (resp?.propostas_apoio || []).join('; '),
        resp?.campo_sinalizar || '',
        resp?.quer_ligacao || '',
        resp?.created_at ? formatDate(resp.created_at) : ''
      ]
    })
    const csv = [header, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'mapeamento_investidores_versa.csv'; a.click()
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
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>Dashboard — Versa Loft</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Mapeamento e cadastro de investidores</p>
        </div>
        <button onClick={exportCsv} className="btn-secondary">
          📤 Exportar CSV Completo
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
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>Carregando dados...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Nome</th>
                  <th>Unidade</th>
                  <th>Status</th>
                  <th>Mapeamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => {
                  const s = statusLabel(inv.status_envio)
                  const resp = inv.respostas && inv.respostas.length > 0 ? inv.respostas[0] : null
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--navy)', fontSize: '0.8rem' }}>{inv.token_unico}</td>
                      <td style={{ fontWeight: 600 }}>
                        <div>{inv.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 400 }}>{inv.email}</div>
                      </td>
                      <td>Unidade {inv.apto}</td>
                      <td>
                        <span className="status-badge" style={{ background: s.color.includes('emerald') ? 'rgba(16,185,129,0.1)' : s.color.includes('blue') ? 'rgba(59,130,246,0.1)' : s.color.includes('orange') ? 'rgba(245,158,11,0.1)' : 'rgba(107,114,128,0.1)', color: s.color.includes('emerald') ? '#059669' : s.color.includes('blue') ? '#2563EB' : s.color.includes('orange') ? '#D97706' : '#6B7280', borderColor: s.color.includes('emerald') ? 'rgba(16,185,129,0.3)' : s.color.includes('blue') ? 'rgba(59,130,246,0.3)' : s.color.includes('orange') ? 'rgba(245,158,11,0.3)' : 'rgba(107,114,128,0.3)' }}>
                          {s.emoji} {s.label}
                        </span>
                      </td>
                      <td>
                        {resp ? (
                          <button onClick={() => setSelectedResp(resp)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'rgba(27,58,107,0.06)' }}>
                            👁️ Ver Respostas Ficha
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Aguardando</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => copyLink(inv.token_unico)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                            {copied === inv.token_unico ? '✅ Copiado' : '🔗 Link'}
                          </button>
                          {inv.status_envio !== 'respondeu' && (
                            <button onClick={() => sendReminder(inv)} className="btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}>
                              📧 Lembrete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Ficha Completa */}
      {selectedResp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setSelectedResp(null)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: '2rem', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid var(--gray-200)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)' }}>Ficha de Mapeamento — Unidade {selectedResp.unidade}</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>Preenchido em: {formatDate(selectedResp.created_at)}</p>
              </div>
              <button onClick={() => setSelectedResp(null)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray-500)' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.875rem' }}>
              {/* Parte 1 */}
              <div style={{ background: 'var(--gray-100)', padding: '1rem', borderRadius: 10 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>PARTE 1 — Dados Cadastrais</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div><strong>Nome:</strong> {selectedResp.nome_completo}</div>
                  <div><strong>CPF/CNPJ:</strong> {selectedResp.cpf_cnpj}</div>
                  <div><strong>E-mail:</strong> {selectedResp.email}</div>
                  <div><strong>WhatsApp:</strong> {selectedResp.whatsapp}</div>
                  <div><strong>Cidade/UF:</strong> {selectedResp.cidade_uf || '—'}</div>
                  <div><strong>CEP:</strong> {selectedResp.cep || '—'}</div>
                  {selectedResp.coproprietario_nome && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Coproprietário:</strong> {selectedResp.coproprietario_nome} ({selectedResp.coproprietario_cpf}) — Tel: {selectedResp.coproprietario_telefone}
                    </div>
                  )}
                  {selectedResp.interlocutor_nome && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <strong>Interlocutor Oficial:</strong> {selectedResp.interlocutor_nome} — Tel: {selectedResp.interlocutor_telefone}
                    </div>
                  )}
                </div>
              </div>

              {/* Parte 2 */}
              <div style={{ background: 'var(--gray-100)', padding: '1rem', borderRadius: 10 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>PARTE 2 — Mapeamento Operacional</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>1. Destinação:</strong> {selectedResp.destinacao_unidade}</div>
                  <div><strong>2. Administração:</strong> {selectedResp.quem_administra} {selectedResp.quem_administra_qual ? `(${selectedResp.quem_administra_qual})` : ''}</div>
                  <div><strong>3. Mobilia:</strong> {selectedResp.como_mobiliar} {selectedResp.como_mobiliar_fornecedor ? `(Fornecedor: ${selectedResp.como_mobiliar_fornecedor})` : ''}</div>
                  <div><strong>4. Pronta em:</strong> {selectedResp.mes_ano_pronta || 'Não informado'} {selectedResp.mes_ano_observacao ? `(${selectedResp.mes_ano_observacao})` : ''}</div>
                  <div><strong>5. Recebe Chaves/Vistoria:</strong> {selectedResp.quem_recebe_chaves} {selectedResp.procurador_nome_telefone ? `(Procurador: ${selectedResp.procurador_nome_telefone})` : ''}</div>
                  <div><strong>6. Pretende Obra (NBR 16280):</strong> {selectedResp.pretende_obra} {selectedResp.pretende_obra_qual ? `(${selectedResp.pretende_obra_qual})` : ''}</div>
                  <div><strong>7. Propostas de Apoio Solicitadas:</strong> {(selectedResp.propostas_apoio || []).join(', ') || 'Nenhuma'}</div>
                  {selectedResp.campo_sinalizar && (
                    <div style={{ marginTop: '0.5rem', background: 'white', padding: '0.75rem', borderRadius: 8, border: '1px solid var(--gray-200)' }}>
                      <strong>8. Campo de Sinalização / Dúvidas:</strong><br />
                      {selectedResp.campo_sinalizar}
                    </div>
                  )}
                  <div><strong>9. Quer Ligação?</strong> {selectedResp.quer_ligacao} {selectedResp.melhor_dia_horario ? `(Horário: ${selectedResp.melhor_dia_horario})` : ''}</div>
                </div>
              </div>

              {/* Parte 3 */}
              <div style={{ background: 'var(--gray-100)', padding: '1rem', borderRadius: 10 }}>
                <h3 style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>PARTE 3 — Declarações & LGPD</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div><strong>Declaração Regulamento Kato/Versa:</strong> {selectedResp.lgpd_consentido ? '✅ Aceito' : '❌ Não'}</div>
                  <div><strong>Autorização Propostas Comerciais (12 meses):</strong> {selectedResp.autoriza_contato ? '✅ Autorizado' : '❌ Não autorizado'}</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button className="btn-primary" onClick={() => setSelectedResp(null)} style={{ maxWidth: 120 }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
