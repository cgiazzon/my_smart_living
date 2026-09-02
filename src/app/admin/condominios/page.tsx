'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Condominio = {
  id: string
  nome: string
  subtitulo_administracao: string
  previsao_entrega: string
  data_limite_devolucao: string
  email_suporte: string
  telefone_suporte: string
  whatsapp_suporte: string
  nome_dpo: string
  email_dpo: string
  telefone_dpo: string
}

export default function CondominiosPage() {
  const supabase = createClient()
  const [condominios, setCondominios] = useState<Condominio[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCond, setEditingCond] = useState<Condominio | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newNome, setNewNome] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('condominios').select('*').order('nome')
    setCondominios((data || []) as Condominio[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCond) return
    setSaving(true)

    const { error } = await supabase
      .from('condominios')
      .update({
        nome: editingCond.nome,
        subtitulo_administracao: editingCond.subtitulo_administracao,
        previsao_entrega: editingCond.previsao_entrega,
        data_limite_devolucao: editingCond.data_limite_devolucao,
        email_suporte: editingCond.email_suporte,
        telefone_suporte: editingCond.telefone_suporte,
        whatsapp_suporte: editingCond.whatsapp_suporte,
        nome_dpo: editingCond.nome_dpo,
        email_dpo: editingCond.email_dpo,
        telefone_dpo: editingCond.telefone_dpo,
      })
      .eq('id', editingCond.id)

    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      load()
    } else {
      alert('Erro ao salvar alterações do condomínio.')
    }
  }

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newNome.trim()) return

    const { error } = await supabase.from('condominios').insert({
      nome: newNome.trim(),
    })

    if (!error) {
      setNewNome('')
      setShowNewModal(false)
      load()
    } else {
      alert('Erro ao criar novo condomínio.')
    }
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy)' }}>Condomínios & Empreendimentos</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.875rem' }}>Configure o nome, sindicância, prazos e contatos exibidos no cabeçalho das pesquisas.</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary" style={{ width: 'auto', padding: '0.625rem 1.25rem' }}>
          + Novo Condomínio
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray-500)' }}>Carregando condomínios...</div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {condominios.map(cond => (
            <div key={cond.id} className="form-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '2px solid var(--gray-200)', paddingBottom: '0.75rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--navy)' }}>🏢 {cond.nome}</h2>
                  <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{cond.subtitulo_administracao}</p>
                </div>
                <button onClick={() => setEditingCond({ ...cond })} className="btn-secondary">
                  ✏️ Editar Cabeçalho / Textos
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
                <div><strong>Previsão de Entrega:</strong><br />{cond.previsao_entrega || '—'}</div>
                <div><strong>Data Limite Devolução:</strong><br />{cond.data_limite_devolucao || '—'}</div>
                <div><strong>Suporte E-mail:</strong><br />{cond.email_suporte || '—'}</div>
                <div><strong>Suporte WhatsApp:</strong><br />{cond.whatsapp_suporte || '—'}</div>
                <div><strong>Encarregado DPO:</strong><br />{cond.nome_dpo || '—'} ({cond.email_dpo || '—'})</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Editar Condomínio */}
      {editingCond && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setEditingCond(null)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>Editar Textos do Condomínio</h2>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Nome Oficial do Condomínio (Exibido no Cabeçalho)</label>
                <input className="form-input" value={editingCond.nome} onChange={e => setEditingCond({ ...editingCond, nome: e.target.value })} required />
              </div>

              <div>
                <label className="form-label">Sindicância & Administração (Subtítulo)</label>
                <input className="form-input" value={editingCond.subtitulo_administracao || ''} onChange={e => setEditingCond({ ...editingCond, subtitulo_administracao: e.target.value })} placeholder="Sindicância & Administração: My Smart Living & Kato Condomínios" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">Previsão de Entrega (Texto)</label>
                  <input className="form-input" value={editingCond.previsao_entrega || ''} onChange={e => setEditingCond({ ...editingCond, previsao_entrega: e.target.value })} placeholder="Outubro/2026" />
                </div>
                <div>
                  <label className="form-label">Data Limite Devolução</label>
                  <input className="form-input" value={editingCond.data_limite_devolucao || ''} onChange={e => setEditingCond({ ...editingCond, data_limite_devolucao: e.target.value })} placeholder="30/10/2026" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">E-mail Suporte Dúvidas</label>
                  <input className="form-input" value={editingCond.email_suporte || ''} onChange={e => setEditingCond({ ...editingCond, email_suporte: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">WhatsApp Suporte Dúvidas</label>
                  <input className="form-input" value={editingCond.whatsapp_suporte || ''} onChange={e => setEditingCond({ ...editingCond, whatsapp_suporte: e.target.value })} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy)', marginBottom: '0.75rem' }}>Informações do Encarregado LGPD (DPO)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label">Nome DPO</label>
                    <input className="form-input" value={editingCond.nome_dpo || ''} onChange={e => setEditingCond({ ...editingCond, nome_dpo: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">E-mail DPO</label>
                    <input className="form-input" value={editingCond.email_dpo || ''} onChange={e => setEditingCond({ ...editingCond, email_dpo: e.target.value })} />
                  </div>
                  <div>
                    <label className="form-label">Telefone DPO</label>
                    <input className="form-input" value={editingCond.telefone_dpo || ''} onChange={e => setEditingCond({ ...editingCond, telefone_dpo: e.target.value })} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setEditingCond(null)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={saving} style={{ width: 'auto' }}>
                  {saving ? 'Salvando...' : saved ? '✅ Salvo!' : '💾 Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Novo Condomínio */}
      {showNewModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setShowNewModal(false)}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: '2rem' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy)', marginBottom: '1rem' }}>Criar Novo Empreendimento</h2>

            <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Nome do Condomínio *</label>
                <input className="form-input" value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Ex: CONDOMÍNIO VERSA LOFT STYLE" required />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  ✅ Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
